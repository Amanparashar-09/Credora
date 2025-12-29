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
    if not repo_codes:
        return 0.0, 0.0

    embeddings = [embed_code(code) for code in repo_codes if code]
    if not embeddings:
        return 0.0, 0.0

    emb = np.array(embeddings)

    x3 = float(np.mean(emb))   # code quality
    x4 = float(np.std(emb))    # complexity

    return x3, x4