import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.metrics import f1_score, hamming_loss
import joblib

from dataset import load_dataset, flatten_features
from embedder import TextEmbedder


DATA_PATH = "../dataset/processed_dataset.json"
MODEL_PATH = "../models/classifier.pkl"


def main():

    print("Loading dataset...")
    data = load_dataset(DATA_PATH)

    texts = [item["raw_text"] for item in data]
    labels = [item["labels"] for item in data]

    print("Extracting embeddings...")
    embedder = TextEmbedder()
    embeddings = embedder.encode(texts)

    print("Flattening structured features...")
    structured_features = np.array([
        flatten_features(item["features"])
        for item in data
    ])

    print("Combining features...")
    X = np.concatenate([structured_features, embeddings], axis=1)

    print("Encoding labels...")
    mlb = MultiLabelBinarizer()
    Y = mlb.fit_transform(labels)

    print("Training model...")
    model = OneVsRestClassifier(
        LogisticRegression(max_iter=2000)
    )
    model.fit(X, Y)

    print("Evaluating...")
    preds = model.predict(X)

    print("Micro F1:", f1_score(Y, preds, average="micro"))
    print("Macro F1:", f1_score(Y, preds, average="macro"))
    print("Hamming Loss:", hamming_loss(Y, preds))

    print("Saving model...")
    joblib.dump({
        "model": model,
        "label_binarizer": mlb
    }, MODEL_PATH)

    print("Done.")


if __name__ == "__main__":
    main()