from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np

_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base")
_model = AutoModel.from_pretrained("microsoft/codebert-base").to(_device)


def embed_code(code: str) -> np.ndarray:
    """Embed a code snippet using CodeBERT on GPU if available."""

    inputs = _tokenizer(
        code,
        return_tensors="pt",
        truncation=True,
        max_length=512,
    )
    # Move tensors to the same device as the model
    inputs = {k: v.to(_device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = _model(**inputs)

    return outputs.last_hidden_state.mean(dim=1).squeeze().cpu().numpy()


def code_features_from_repos(repo_codes):
    """Extract code quality and complexity features from repository code."""
    if not repo_codes:
        return 0.5, 0.5  # Default neutral values instead of 0.0

    embeddings = [embed_code(code) for code in repo_codes if code]
    if not embeddings:
        return 0.5, 0.5  # Default neutral values

    emb = np.array(embeddings)

    # Normalize embeddings to 0-1 range
    # CodeBERT embeddings typically have mean around 0, std around 0.3
    x3 = min(max((float(np.mean(emb)) + 1.0) / 2.0, 0.0), 1.0)  # code quality (normalize around 0)
    x4 = min(float(np.std(emb)) * 3.0, 1.0)                      # complexity (scale up std)

    return x3, x4