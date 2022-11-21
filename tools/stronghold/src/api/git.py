"""Represents the API check's interaction with git."""

from __future__ import annotations

from collections.abc import Iterable, Sequence
import dataclasses
import pathlib
import subprocess
from typing import Any, Optional, Union


class Repository:
    """Represents a local git repository."""

    def __init__(self, dir: pathlib.Path) -> None:
        """Creates a handle over the repository in the directory."""
        self._dir = dir

    @property
    def dir(self, /) -> pathlib.Path:
        """Gets the repository's local directory."""
        return self._dir

    def get_files_in_range(self, /, range: str) -> Iterable[pathlib.Path]:
        """Gets files modified in a range of commits."""
        pinfo = self.run(
            ['diff-tree', '--name-only', '-r', range],
            check=True,
            stdout=subprocess.PIPE,
        )
        return [pathlib.Path(p) for p in pinfo.stdout.splitlines()]

    # TODO migrate all users to get_files_in_range and delete this and
    # CommitInfo.
    def get_commit_info(self, *, commit_id: str = 'HEAD') -> CommitInfo:
        """Gets information about a particular commit.

        Defaults to the most recent commit.
        """
        return CommitInfo(
            hash='', files=list(self.get_files_in_range(f'{commit_id}~..{commit_id}'))
        )

    def get_contents(
        self, path: pathlib.Path, *, commit_id: str = 'HEAD'
    ) -> Optional[str]:
        """Gets the contents of a file at a specified commit.

        Defaults to the most recent commit.
        """
        proc = self.run(
            ['show', f'{commit_id}:{path}'],
            stdout=subprocess.PIPE,
        )
        if proc.returncode == 128:
            # The file does not exist.
            return None
        proc.check_returncode()  # check if any other error is present
        assert proc.stdout is not None  # this was piped
        return proc.stdout

    def run(
        self, args: list[Union[pathlib.Path, str]], /, **kwargs: Any
    ) -> subprocess.CompletedProcess[str]:
        """Runs a git command in the repository."""
        args.insert(0, 'git')
        return subprocess.run(
            args,
            cwd=self._dir,
            **kwargs,
            # We do not allow overridng text since
            # we have defined the return type to be
            # unicode.
            text=True,
        )


@dataclasses.dataclass
class CommitInfo:
    """Represents basic info about a git commit."""

    # The full hash identifying the commit.
    hash: str
    # The files modified in the commit.
    files: Sequence[pathlib.Path]