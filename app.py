from flask import Flask, request, jsonify 
from flask_cors import CORS 
import joblib 
import re 
import tldextract 
from urllib.parse import urlparse 
import pickle 
from scipy.sparse import hstack,csr_matrix 
import math 
app = Flask(__name__) 
CORS(app) 
with open('phishing_model_bundle.pkl', 'rb') as f: 
    bundle = pickle.load(f) 
 
model = bundle['model'] 
vectorizer = bundle['vectorizer'] 
scaler = bundle['scaler'] 
# ✅ Полный обработчик признаков (21 фича) 
def prepare_features_from_url(url): 
    if not url.startswith("http"): 
        url = "http://" + url 
    from urllib.parse import urlparse 
    parsed = urlparse(url) 
    hostname = parsed.hostname or "" 
    domain_parts = hostname.split('.') if hostname else [] 
    subdomain = '.'.join(domain_parts[:-2]) if len(domain_parts) > 2 else '' 
    domain = domain_parts[-2] if len(domain_parts) > 1 else '' 
 
    url_len = len(url) 
    is_at = int('@' in url) 
    have_dash = int('-' in hostname) 
    is_ip = int(bool(re.fullmatch(r'(\d{1,3}\.){3}\d{1,3}', hostname))) 
    subdomain_count = len(domain_parts) - 2 if len(domain_parts) > 2 else 0 
    domain_len = len(domain) 
    has_suspicious_words = int(any(w in url.lower() for w in ["login", "secure", "update", "verify", "signin", "account"])) 
 
    dot_count = url.count('.') 
    path_len = len(parsed.path) 
    query_count = len(parsed.query.split('&')) if parsed.query else 0 
    has_port = int(bool(parsed.port)) 
    special_char_freq = len(re.findall(r'[!@#$%^&*(),?":{}|<>]', url)) 
    brand_in_subdomain = int(any(b in subdomain.lower() for b in ['paypal', 'google', 'amazon', 'apple', 'facebook', 'microsoft'])) 
    numeric_count = sum(c.isdigit() for c in hostname) 
    fake_tld_in_path = int(any(tld in parsed.path.lower() for tld in ['com', 'net', 'org', 'ru', 'de', 'xyz', 'top', 'site', 'online'])) 
    blacklist_word_count = sum(w in url.lower() for w in ['login', 'verify', 'update', 'secure', 'account', 'bank', 'confirm', 'wp-admin']) 
 
    # TF-IDF токены 
    tokens = ' '.join([t for t in re.split(r'[/:.?=&_\-]+', url.lower()) if len(t) > 1]) 
    tfidf = vectorizer.transform([tokens]) 
 
    # Smart features 
    ends_with_suspicious = int(any(parsed.path.endswith(e) for e in ['.php', '.html', '.asp', '.aspx'])) 
    subdomain_depth = hostname.count('.') - 1 
    has_encoded = int('%' in url) 
    is_research = int(any(w in url for w in ['dataset', 'paper', 'detection', 'project', 'code'])) 
    entropy = 0 
    for c in set(url): 
        p = url.count(c) / len(url) 
        entropy -= p * math.log2(p) 
 
    full_vector = [ 
        url_len, is_at, have_dash, is_ip, subdomain_count, domain_len, has_suspicious_words, 
        dot_count, path_len, query_count, has_port, special_char_freq, 
        brand_in_subdomain, numeric_count, fake_tld_in_path, blacklist_word_count, 
        ends_with_suspicious, subdomain_depth, has_encoded, is_research, round(entropy, 4) 
    ] 
 
    struct_scaled = scaler.transform([full_vector]) 
    return hstack([tfidf, csr_matrix(struct_scaled)]), { 
    'url_len': url_len, 
    'is_at': is_at, 
    'have_dash': have_dash, 
    'is_ip': is_ip, 
    'subdomain_count': subdomain_count, 
    'domain_len': domain_len, 
    'has_suspicious_words': has_suspicious_words, 
    'dot_count': dot_count, 
    'path_len': path_len, 
    'query_count': query_count, 
    'has_port': has_port, 
    'special_char_freq': special_char_freq, 
    'brand_in_subdomain': brand_in_subdomain, 
    'numeric_count': numeric_count, 
    'fake_tld_in_path': fake_tld_in_path, 
    'blacklist_word_count': blacklist_word_count, 
    'ends_with_suspicious': ends_with_suspicious, 
    'subdomain_depth': subdomain_depth, 
    'has_encoded': has_encoded, 
    'is_research': is_research, 
    'entropy': round(entropy, 4) 
} 
@app.route('/predict', methods=['POST']) 
def predict(): 
    data = request.get_json() 
    url = data.get('url', '') 
    features, raw_features = prepare_features_from_url(url) 
     
    prediction = model.predict(features)[0]
    proba = model.predict_proba(features)[0][1]  # вероятность «phishing» 
 
    return jsonify({ 
        'prediction': 'phishing' if prediction == 1 else 'legitimate', 
        'probability': round(proba, 3), 
        'features': raw_features  
    }) 
if __name__ == '__main__': 
    app.run(host='0.0.0.0', port=5001)