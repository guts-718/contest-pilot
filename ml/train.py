import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.metrics import f1_score, hamming_loss
from sklearn.preprocessing import StandardScaler
import joblib

from dataset import load_dataset, flatten_features
from embedder import TextEmbedder

DATA_PATH = "../dataset/processed_filtered.json"
MODEL_PATH = "../models/classifier.pkl"


def main():

    print("Loading dataset...")
    data = load_dataset(DATA_PATH)

    texts = [item["raw_text"] for item in data]
    labels = [item["labels"] for item in data]

    print("Extracting embeddings...")
    embedder = TextEmbedder()
    embeddings = np.array(embedder.encode(texts))

    print("Flattening structured features...")
    print("Feature vector length:", len(flatten_features(data[0]["features"])))
    structured_features = np.array([
    flatten_features(item["features"])
    for item in data
    ], dtype=np.float32)

    structured_features = np.array(structured_features, dtype=np.float32)

    # scale structured features only
    scaler = StandardScaler()
    structured_features = scaler.fit_transform(structured_features)

    print("Combining features...")
    X = np.hstack((structured_features, embeddings))

    print("Encoding labels...")
    mlb = MultiLabelBinarizer()
    Y = mlb.fit_transform(labels)

    print("Training model...")
    model = OneVsRestClassifier(
        LogisticRegression(
            max_iter=2000,
            class_weight="balanced",
            n_jobs=-1
        )
    )

    model.fit(X, Y)

    print("Evaluating...")
    preds = model.predict(X)

    print("Micro F1:", f1_score(Y, preds, average="micro"))
    print("Macro F1:", f1_score(Y, preds, average="macro"))
    print("Hamming Loss:", hamming_loss(Y, preds))

    print("Saving model...")
    joblib.dump(
        {
            "model": model,
            "label_binarizer": mlb,
            "scaler": scaler
        },
        MODEL_PATH
    )

    print("Done.")


if __name__ == "__main__":
    main()



# Evaluating...
# Micro F1: 0.42786036036036035
# Macro F1: 0.37856979632675986
# Hamming Loss: 0.18129460462460747
# Saving model...
# Done.