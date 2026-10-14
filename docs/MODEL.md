# Model notes

[← Back to README](../README.md)

These notes describe the artifacts present in this repository. They separate verified inference behavior from results reported in the June 2025 diploma thesis.

## Intended use

SafeSurf AI is a research prototype for binary classification of URL strings. Its browser extension presents predictions to a user; it does not block navigation. A `legitimate` label is a model decision, not evidence that a website is safe.

The inference pipeline uses no page fetch, WHOIS lookup, certificate inspection, screenshot analysis, or live blacklist query.

## Active artifact

| Property | Verified value |
| --- | --- |
| File | `phishing_model_bundle.pkl` |
| Size | 91,572,930 bytes, approximately 87.3 MiB |
| Bundle keys | `model`, `vectorizer`, `scaler` |
| Estimator | scikit-learn `VotingClassifier` |
| Combination | `voting="soft"`, equal weights |
| Classes | `0`: legitimate · `1`: phishing |
| Input dimension | 521 |
| Text representation | `TfidfVectorizer`, 500 word-unigram features |
| Numeric representation | `StandardScaler`, 21 features |
| Serialization versions | scikit-learn 1.6.1 · XGBoost 2.1.4 |

The fitted ensemble contains a 100-tree Random Forest, an XGBoost classifier with 100 boosting trees, and Logistic Regression with `max_iter=1000`. The API uses the average class probabilities to choose the class. It rounds the phishing score to three decimal places in its JSON response.

## Feature contract

The current extractor in `app.py` supplies numeric features in this order:

| # | API feature | Current calculation |
| --- | --- | --- |
| 1 | `url_len` | URL length after adding `http://` when needed |
| 2 | `is_at` | Presence of `@` in the URL |
| 3 | `have_dash` | Hyphen in the hostname |
| 4 | `is_ip` | Hostname matches an IPv4-shaped regex |
| 5 | `subdomain_count` | Hostname components minus two, minimum zero |
| 6 | `domain_len` | Length of the penultimate hostname component |
| 7 | `has_suspicious_words` | Presence of selected keywords |
| 8 | `dot_count` | Dots in the full URL |
| 9 | `path_len` | Parsed path length |
| 10 | `query_count` | Query segments separated by `&` |
| 11 | `has_port` | Presence of a parsed port |
| 12 | `special_char_freq` | Count of characters matching the selected regex |
| 13 | `brand_in_subdomain` | Selected brand names in the computed subdomain |
| 14 | `numeric_count` | Digits in the hostname |
| 15 | `fake_tld_in_path` | Selected TLD-like substrings in the path |
| 16 | `blacklist_word_count` | Number of selected suspicious words found |
| 17 | `ends_with_suspicious` | Path ending in `.php`, `.html`, `.asp`, or `.aspx` |
| 18 | `subdomain_depth` | Hostname dot count minus one |
| 19 | `has_encoded` | Presence of `%` |
| 20 | `is_research` | Selected research-related substrings |
| 21 | `entropy` | Shannon entropy of URL characters, rounded to four decimals |

The scaler calls feature 20 `is_phishing_related_research`; the API returns it as `is_research`.

Before TF-IDF transformation, the URL is lowercased, split on common separators, and tokens longer than one character are joined with spaces. The numeric features are scaled and appended to the text vector.

### Preprocessing questions

The current domain parser does not use the Public Suffix List. For `example.co.uk`, `domain_len` measures `co`. The thesis describes a domain-plus-suffix length, so the actual training extractor needs to be recovered before changing inference formulas.

The saved scaler reports 95,910 fitted samples, while the Random Forest reports 76,728 training samples. This is consistent with an 80/20 split, but raises a question about fitting preprocessing before that split. It does not establish the entire training procedure or prove a specific evaluation failure.

The scaler records zero variance and zero mean for `isIp`, `has_port`, `brand_in_subdomain`, and `numeric_count`. Those columns were constant during its fit, although the current extractor can produce nonzero values. The reason needs investigation in the original training data and code.

## Evaluation evidence

The thesis reports 95,910 labeled examples: 55,914 phishing and 39,996 legitimate. It describes multiple data sources, an 80/20 split, and accuracy figures around 95–97% in different sections.

The repository does not include the dataset, collection pipeline, training notebooks, exact held-out set, or complete ensemble evaluation. Therefore those figures are **reported research results, not a reproduced benchmark for this artifact**. Dataset provenance, label quality, preprocessing order, and score calibration remain unverified.

### Local functional checks

On 14 October 2026, the current Flask endpoint was exercised with `test_client` using Python 3.13, scikit-learn 1.6.1, and XGBoost 2.1.4. No target websites were fetched during these checks.

| URL string supplied to the API | Prediction | Phishing score |
| --- | --- | --- |
| `https://google.com` | phishing | 0.576 |
| `https://google.com/` | phishing | 0.586 |
| `https://github.com/baidar-10/Diploma` | phishing | 0.631 |
| `https://du.astanait.edu.kz/` | legitimate | 0.429 |
| `https://webs-9550e6.webflow.io/` | phishing | 0.803 |

The last two strings are examples from thesis screenshots; their predicted classes matched the screenshots. Their current availability or threat status was not checked. The Google and GitHub results demonstrate false positives on the supplied URLs. A small set of checks cannot measure overall accuracy, recall, or false-positive rate.

Input validation was also checked: empty inputs can be classified, while several malformed JSON/URL inputs produce server errors. This is tracked as API work in the [roadmap](ROADMAP.md).

## Other artifacts

| File | Contents and role |
| --- | --- |
| `xgb_model.pkl` | Separate XGBoost model expecting seven features; unused by `app.py` |
| `phishing_model.pkl` | 95-byte metadata dictionary with a model-name string and a function reference; not a fitted Random Forest |

These artifacts are retained for project history. They are not interchangeable with the active 521-feature bundle.

## Browser interpretation

Trusted domains bypass inference and receive a `legitimate` label. Manual trust is a user preference, not training feedback. The local phishing list stores model classifications; it is not a collection of independently verified threats.

The notification's reasons are fixed checks on raw features, such as URL length or suspicious keywords. They do not identify which features caused an ensemble decision. Exported CSV files contain URL strings only, not full prediction reports.
