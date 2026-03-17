FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    flask>=2.0 \
    flask-cors>=3.0 \
    joblib>=1.0 \
    tldextract>=3.0 \
    scipy>=1.7 \
    "scikit-learn>=1.6,<1.7" \
    xgboost>=2.0

COPY app.py phishing_model_bundle.pkl ./

EXPOSE 5001

CMD ["python", "app.py"]
