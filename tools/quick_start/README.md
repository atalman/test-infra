# Quick start module

Generates the data behind the install selector on
https://pytorch.org/get-started/locally/ and the third-party accelerator picker
on the Get Started page. This was previously in `pytorch/pytorch.github.io`
(`.github/workflows/update-quick-start-module.yml` and `scripts/`).

The workflow `.github/workflows/update-quick-start-module.yml` runs daily and
opens a PR in this repo with the regenerated files.

## Layout

| Path | Role |
|---|---|
| `scripts/gen_quick_start_module.py` | Reads the build matrices from `tools/scripts/generate_binary_build_matrix.py` (via the `generate_binary_build_matrix.yml` workflow) and updates `published_versions.json` and `releases.json`. |
| `scripts/gen_additional_platforms.py` | Builds `additional-platforms.json` from `_additional_platforms/*.json` and `_get_started/additional_platforms/*.md`. |
| `_additional_platforms/*.json`, `_get_started/additional_platforms/*.md` | Hand-written inputs, one pair per vendor platform. |
| `published_versions.json`, `releases.json`, `additional-platforms.json` | **Generated.** Do not edit by hand. |

## Running locally

```bash
cd tools/quick_start
# one matrix file per OS and channel, as the workflow writes them
for spec in "linux nightly" "windows nightly" "macos-arm64 nightly" \
            "linux release" "windows release" "macos-arm64 release"; do
  set -- $spec
  PACKAGE_TYPE=all OS=$1 CHANNEL=$2 GETTING_STARTED=true BUILD_PYTHON_ONLY=disable \
    python3 ../scripts/generate_binary_build_matrix.py > "${1/macos-arm64/macos}_$2_matrix.json"
done
python3 scripts/gen_quick_start_module.py
rm *_matrix.json

pip install markdown pygments
python3 scripts/gen_additional_platforms.py
```
