# import numpy as np
# from sklearn.linear_model import LogisticRegression
# from sklearn.multiclass import OneVsRestClassifier
# from sklearn.preprocessing import MultiLabelBinarizer
# from sklearn.metrics import f1_score, hamming_loss
# from sklearn.preprocessing import StandardScaler
# import joblib
# from sklearn.ensemble import RandomForestClassifier
# from sklearn.model_selection import train_test_split
# from dataset import load_dataset, flatten_features
# from embedder import TextEmbedder

# DATA_PATH = "../dataset/processed_filtered.json"
# MODEL_PATH = "../models/classifier.pkl"

# def predict_tags_with_scores(probs, label_binarizer, top_k=5):
#     labels = label_binarizer.classes_

#     results = []

#     for row in probs:
#         tag_scores = list(zip(labels, row))
#         tag_scores.sort(key=lambda x: x[1], reverse=True)

#         results.append(tag_scores[:top_k])

#     return results

# def main():

#     print("Loading dataset...")
#     data = load_dataset(DATA_PATH)

#     texts = [item["raw_text"] for item in data]
#     labels = [item["labels"] for item in data]

#     avg_labels = np.mean([len(l) for l in labels])
#     print("average labels:", avg_labels)

#     print("Extracting embeddings...")
#     embedder = TextEmbedder()
#     embeddings = np.array(embedder.encode(texts))

#     print("Flattening structured features...")
#     print("Feature vector length:", len(flatten_features(data[0]["features"])))
#     structured_features = np.array([
#     flatten_features(item["features"])
#     for item in data
#     ], dtype=np.float32)

#     structured_features = np.array(structured_features, dtype=np.float32)

#     # scale structured features only
#     scaler = StandardScaler()
#     structured_features = scaler.fit_transform(structured_features)

#     print("Combining features...")
#     X = np.hstack((structured_features, embeddings))

#     print("Encoding labels...")
#     mlb = MultiLabelBinarizer()
#     Y = mlb.fit_transform(labels)

#     print("Training model...")
#     # model = OneVsRestClassifier(
#     #     LogisticRegression(
#     #         max_iter=2000,
#     #         class_weight="balanced",
#     #         n_jobs=-1
#     #     )
#     # )

#     model = OneVsRestClassifier(
#     RandomForestClassifier(
#         n_estimators=200,
#         max_depth=None,
#         n_jobs=-1
#     )
#     )
#     X_train, X_test, Y_train, Y_test = train_test_split(
#         X, Y, test_size=0.2, random_state=42
#     )

#     model.fit(X_train, Y_train)
#     print("evaluating....")
#     probs = model.predict_proba(X_test)

#     # print("Evaluating...")
#     # probs = model.predict_proba(X)
#     predictions = predict_tags_with_scores(probs, mlb)
#     print("Predicted:", predictions[0])
#     print("Actual:", [mlb.classes_[i] for i in np.where(Y_test[0] == 1)[0]])

#     preds = np.zeros_like(probs)
#     # use threshold when confident, use top-k when uncertain
#     THRESHOLD = 0.33
#     TOP_K = 2

#     probs = model.predict_proba(X_test)

#     preds = np.zeros_like(probs)

#     TOP_K = 2

#     for i, row in enumerate(probs):
#         top_k = np.argsort(row)[-TOP_K:]
#         preds[i, top_k] = 1

#     # for i,row in enumerate(probs):

#     #     selected = np.where(row >= THRESHOLD)[0]

#     #     if len(selected) == 0:
#     #         top_k = np.argsort(row)[-TOP_K:]
#     #         preds[i, top_k] = 1
#     #     else:
#     #         preds[i, selected] = 1
    
#     print("Micro F1:", f1_score(Y_test, preds, average="micro"))
#     print("Macro F1:", f1_score(Y_test, preds, average="macro"))
#     print("Hamming Loss:", hamming_loss(Y_test, preds))

#     print("Saving model...")
#     joblib.dump(
#         {
#             "model": model,
#             "label_binarizer": mlb,
#             "scaler": scaler
#         },
#         MODEL_PATH
#     )

#     print("Done.")


# if __name__ == "__main__":
#     main()



# # Evaluating logistic regression
# # Micro F1: 0.42786036036036035
# # Macro F1: 0.37856979632675986
# # Hamming Loss: 0.18129460462460747
# # Saving model...
# # Done.



# # Evaluating random forest: 
# # Micro F1: 0.8075791725560607
# # Macro F1: 0.7874837554718107
# # Hamming Loss: 0.03594775906365972
# # Saving model...
# # Done.
import numpy as np
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer, StandardScaler
from sklearn.metrics import f1_score, hamming_loss
from sklearn.model_selection import train_test_split
from sklearn.metrics import label_ranking_average_precision_score

from dataset import load_dataset, flatten_features
from embedder import TextEmbedder


from sklearn.decomposition import PCA
from lightgbm import LGBMClassifier


DATA_PATH = "../dataset/processed_filtered.json"
MODEL_PATH = "../models/classifier.pkl"

# ----------------------------
# Config
# ----------------------------
TOP_K = 3
THRESHOLD = 0.30   # tuned for tree models


def hybrid_predict(probs):
    """
    threshold + top-k fallback
    """
    preds = np.zeros_like(probs)

    for i, row in enumerate(probs):
        selected = np.where(row >= THRESHOLD)[0]

        if len(selected) == 0:
            top_k = np.argsort(row)[-TOP_K:]
            preds[i, top_k] = 1
        else:
            preds[i, selected] = 1

    return preds


def predict_with_scores(probs, mlb, top_k=5):
    labels = mlb.classes_
    results = []

    for row in probs:
        pairs = list(zip(labels, row))
        pairs.sort(key=lambda x: x[1], reverse=True)
        results.append(pairs[:top_k])

    return results

def topk_predict(probs, k=3):
    preds = np.zeros_like(probs)

    for i, row in enumerate(probs):
        top_k = np.argsort(row)[-k:]
        preds[i, top_k] = 1

    return preds

def main():

    print("Loading dataset...")
    data = load_dataset(DATA_PATH)

    texts = [item["raw_text"] for item in data]
    labels = [item["labels"] for item in data]

    avg_labels = np.mean([len(l) for l in labels])
    print("Average labels:", avg_labels)

    # ----------------------------
    # Embeddings
    # ----------------------------
    print("Extracting embeddings...")
    embedder = TextEmbedder()
    embeddings = np.array(embedder.encode(texts))

    # Reduce embeddings
    pca = PCA(n_components=128, random_state=42)
    embeddings = pca.fit_transform(embeddings)

    # ----------------------------
    # Structured features
    # ----------------------------
    print("Flattening structured features...")
    structured_features = np.array([
        flatten_features(item["features"])
        for item in data
    ], dtype=np.float32)

    print("Feature vector length:", structured_features.shape[1])

    # ----------------------------
    # Combine
    # ----------------------------
    print("Combining features...")
    X = np.concatenate([structured_features, embeddings], axis=1)

    # ----------------------------
    # Scaling
    # ----------------------------
    scaler = StandardScaler()
    X = scaler.fit_transform(X)

    # ----------------------------
    # Labels
    # ----------------------------
    print("Encoding labels...")
    mlb = MultiLabelBinarizer()
    Y = mlb.fit_transform(labels)

    # ----------------------------
    # Train/Test Split
    # ----------------------------
    X_train, X_test, Y_train, Y_test = train_test_split(
        X, Y, test_size=0.2, random_state=42
    )

    # ----------------------------
    # Model
    # ----------------------------
    print("Training model...")
    # model = OneVsRestClassifier(
    #     RandomForestClassifier(
    #         n_estimators=200,
    #         n_jobs=-1,
    #         random_state=42
    #     )
    # )

    from lightgbm import LGBMClassifier

    model = OneVsRestClassifier(
        LGBMClassifier(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=-1,
            num_leaves=64,
            n_jobs=-1
        )
    )

    model.fit(X_train, Y_train)

    # ----------------------------
    # Evaluation
    # ----------------------------
    print("Evaluating...")

    probs = model.predict_proba(X_test)

    # preds = hybrid_predict(probs)
    preds = topk_predict(probs, k=3)

    micro = f1_score(Y_test, preds, average="micro")
    macro = f1_score(Y_test, preds, average="macro")
    hamming = hamming_loss(Y_test, preds)
    lrap = label_ranking_average_precision_score(Y_test, probs)

    print("Micro F1:", micro)
    print("Macro F1:", macro)
    print("Hamming Loss:", hamming)
    print("LRAP:", lrap)

    # ----------------------------
    # Sample prediction
    # ----------------------------
    sample_preds = predict_with_scores(probs, mlb, top_k=5)

    print("\nSample Prediction:")
    print("Predicted:", sample_preds[0])
    print("Actual:", [mlb.classes_[i] for i in np.where(Y_test[0] == 1)[0]])

    # ----------------------------
    # Save model
    # ----------------------------
    print("Saving model...")
    joblib.dump({
        "model": model,
        "scaler": scaler,
        "label_binarizer": mlb
    }, MODEL_PATH)

    print("Done.")


if __name__ == "__main__":
    main()


# Micro F1: 0.4447403462050599
# Macro F1: 0.26556179339719893




# result after PCA:
# Evaluating...
# Micro F1: 0.4447403462050599
# Macro F1: 0.26556179339719893
# Hamming Loss: 0.10567251461988304
# LRAP: 0.5847845456456008

# result after LGBM classifier:
# Micro F1: 0.4484277373758066
# Macro F1: 0.2984187405059649
# Hamming Loss: 0.10497076023391813
# LRAP: 0.5957493814688993
