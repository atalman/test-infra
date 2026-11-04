# Quick start module

Generates the data behind the install selector on
https://pytorch.org/get-started/locally/ and the third-party accelerator picker
on the Get Started page. This was previously in `pytorch/pytorch.github.io`
(`.github/workflows/update-quick-start-module.yml` and `scripts/`).

The generated files are checked in. The `QUICKSTART` lint regenerates them and
fails if they differ from what is committed, so a change to an input (including
`tools/scripts/generate_binary_build_matrix.py`) must include the regenerated
files.

## Layout

| Path | Role |
|---|---|
| `scripts/gen_quick_start_module.py` | Runs `tools/scripts/generate_binary_build_matrix.py` for the getting-started matrices and updates `published_versions.json` and `releases.json`. |
| `scripts/gen_additional_platforms.py` | Builds `additional-platforms.json` from `_additional_platforms/*.json` and `_get_started/additional_platforms/*.md`. |
| `_additional_platforms/*.json`, `_get_started/additional_platforms/*.md` | Hand-written inputs, one pair per vendor platform. |
| `published_versions.json`, `releases.json`, `additional-platforms.json` | **Generated.** Do not edit by hand. |

## Regenerating

```bash
lintrunner -a --take QUICKSTART
```

or run the scripts directly (`gen_additional_platforms.py` needs the
`markdown` and `pygments` versions pinned in `.lintrunner.toml`):

```bash
python3 tools/quick_start/scripts/gen_quick_start_module.py
python3 tools/quick_start/scripts/gen_additional_platforms.py
```
