#!/bin/sh
#
# doze installer: the `doze` command line, from doze's GitHub releases.
# POSIX sh (dash, busybox ash, bash, zsh, ksh).
#
#   curl -fsSL https://doze-dev.com/install.sh | sh
#
# It downloads doze_<version>_<os>_<arch>.tar.gz for this machine, checks it
# against the release's checksums.txt, and puts `doze` in ~/.local/bin. It
# asks for no password and touches nothing else: no daemon, no ~/.doze, no
# shell profile unless you let it add the PATH line.
#
# Options (each has an environment variable; the flag wins):
#   -v, --version <tag>   a release, e.g. v0.2.0 (default: the newest)   DOZE_VERSION
#   -d, --dir <path>      where `doze` goes (default: ~/.local/bin)      DOZE_INSTALL_DIR
#       --no-modify-path  leave your shell profile alone                 DOZE_NO_MODIFY_PATH=1
#       --uninstall       remove the binary and the PATH line
#
# On a Mac the app is the usual way in (it puts `doze` on your PATH too):
#   brew install --cask doze-dev/tap/doze
# Install the CLI or the app, not both.

set -eu

REPO="doze-dev/doze"

die() {
	echo "install: $*" >&2
	exit 1
}
have() { command -v "$1" >/dev/null 2>&1; }
need() { have "$1" || die "required command not found: $1"; }

usage() {
	cat <<'EOF'
doze installer: the doze command line, from doze's GitHub releases.

Usage:
  curl -fsSL https://doze-dev.com/install.sh | sh -s -- [options]

Options (each has an environment variable; the flag wins):
  -v, --version <tag>   a release, e.g. v0.2.0 (default: the newest)   DOZE_VERSION
  -d, --dir <path>      where doze goes (default: ~/.local/bin)        DOZE_INSTALL_DIR
      --no-modify-path  leave your shell profile alone                 DOZE_NO_MODIFY_PATH=1
      --uninstall       remove the binary and the PATH line
  -h, --help            this help
EOF
}

version="${DOZE_VERSION:-}"
bin_dir="${DOZE_INSTALL_DIR:-}"
no_modify_path="${DOZE_NO_MODIFY_PATH:-}"
action=install

while [ $# -gt 0 ]; do
	case "$1" in
	-v | --version)
		[ $# -ge 2 ] || die "--version needs a value, e.g. --version v0.2.0"
		version="$2"
		shift 2
		;;
	--version=*)
		version="${1#*=}"
		shift
		;;
	-d | --dir)
		[ $# -ge 2 ] || die "--dir needs a value"
		bin_dir="$2"
		shift 2
		;;
	--dir=*)
		bin_dir="${1#*=}"
		shift
		;;
	--no-modify-path)
		no_modify_path=1
		shift
		;;
	--uninstall)
		action=uninstall
		shift
		;;
	-h | --help)
		usage
		exit 0
		;;
	*) die "unknown option: $1 (try --help)" ;;
	esac
done

BIN_DIR="${bin_dir:-$HOME/.local/bin}"
MARK="# doze (installed by doze-dev.com/install.sh)"

if [ "$action" = uninstall ]; then
	removed=0
	if [ -f "$BIN_DIR/doze" ]; then
		rm -f "$BIN_DIR/doze"
		echo "Removed $BIN_DIR/doze"
		removed=1
	fi
	for p in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.bash_profile" "$HOME/.profile"; do
		[ -f "$p" ] || continue
		grep -qs -F "$MARK" "$p" || continue
		tmp="$(mktemp)"
		# Drop the marker and the export line right after it.
		awk -v mark="$MARK" '$0 == mark { skip = 1; next } skip { skip = 0; next } { print }' "$p" >"$tmp" && cat "$tmp" >"$p"
		rm -f "$tmp"
		echo "Removed the PATH line from $p"
		removed=1
	done
	[ "$removed" = 1 ] || echo "Nothing to uninstall (looked for $BIN_DIR/doze and the PATH line)."
	echo "Your stacks and doze's data (~/.doze) were left alone."
	exit 0
fi

for c in uname mktemp tar mkdir chmod cp tr grep awk sed; do
	need "$c"
done

os="$(uname -s | tr '[:upper:]' '[:lower:]')"
arch="$(uname -m)"
case "$arch" in
x86_64 | amd64) arch=amd64 ;;
arm64 | aarch64) arch=arm64 ;;
*) die "no doze build for the '$arch' architecture. See https://doze-dev.com/download/" ;;
esac
case "$os" in
linux) ;;
darwin)
	[ "$arch" = arm64 ] || die "doze runs on Apple silicon Macs only: its engines are built for arm64. On an Intel Mac, use a Linux VM. See https://doze-dev.com/download/"
	;;
mingw* | msys* | cygwin*) die "on Windows, install the Linux build inside WSL2: open your WSL shell and run this again." ;;
*) die "no doze build for '$os'. doze runs on macOS (Apple silicon) and Linux. See https://doze-dev.com/download/" ;;
esac

if have curl; then
	download() { curl --proto '=https' --tlsv1.2 --retry 3 -fsSL "$1" -o "$2"; }
	fetch() { curl --proto '=https' --tlsv1.2 --retry 3 -fsSL "$1"; }
elif have wget; then
	download() { wget -qO "$2" "$1"; }
	fetch() { wget -qO- "$1"; }
else
	die "need curl or wget to download."
fi
if have sha256sum; then
	sha256() { sha256sum "$1" | awk '{print $1}'; }
elif have shasum; then
	sha256() { shasum -a 256 "$1" | awk '{print $1}'; }
else
	die "need sha256sum or shasum to check the download."
fi

if [ -z "$version" ]; then
	echo "Finding the newest doze release..."
	# The newest v<semver> tag that is not a pre-release. Read from the list,
	# not /releases/latest: a repo's "latest" can be some other kind of release.
	version="$(fetch "https://api.github.com/repos/$REPO/releases?per_page=30" |
		awk '/"tag_name":/ { tag = $0; sub(/.*"tag_name": *"/, "", tag); sub(/".*/, "", tag) }
		     /"prerelease": *false/ { if (tag ~ /^v[0-9]/) { print tag; exit } }' || true)"
fi
[ -n "$version" ] || die "could not find a doze release. Name one: DOZE_VERSION=v0.2.0, or see https://github.com/$REPO/releases"
case "$version" in v*) ;; *) version="v$version" ;; esac

ver="${version#v}"
asset="doze_${ver}_${os}_${arch}.tar.gz"
base="https://github.com/$REPO/releases/download/$version"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT INT TERM

echo "Downloading $asset..."
download "$base/$asset" "$tmp/$asset" || die "could not download $base/$asset. Is $version released for $os/$arch?"
download "$base/checksums.txt" "$tmp/checksums.txt" || die "could not download checksums.txt for $version."

expected="$(awk -v f="$asset" '$2 == f { print $1 }' "$tmp/checksums.txt")"
[ -n "$expected" ] || die "checksums.txt for $version does not list $asset."
actual="$(sha256 "$tmp/$asset")"
[ "$expected" = "$actual" ] || die "checksum mismatch for $asset (expected $expected, got $actual). Nothing was installed."
echo "Checksum OK."

tar -xzf "$tmp/$asset" -C "$tmp"
[ -f "$tmp/doze" ] || die "$asset has no doze binary in it."
mkdir -p "$BIN_DIR"
cp "$tmp/doze" "$BIN_DIR/doze.new"
chmod 0755 "$BIN_DIR/doze.new"
mv -f "$BIN_DIR/doze.new" "$BIN_DIR/doze"
echo "Installed doze $ver to $BIN_DIR/doze"

if ! "$BIN_DIR/doze" version >/dev/null 2>&1; then
	echo "warning: $BIN_DIR/doze did not run. Check that this machine is $os/$arch." >&2
fi

case ":${PATH}:" in
*":$BIN_DIR:"*) on_path=1 ;;
*) on_path=0 ;;
esac
line="export PATH=\"$BIN_DIR:\$PATH\""
if [ "$on_path" = 0 ]; then
	profile=""
	if [ "$no_modify_path" != 1 ]; then
		case "${SHELL:-}" in
		*/zsh) profile="$HOME/.zshrc" ;;
		*/bash) if [ -f "$HOME/.bashrc" ]; then profile="$HOME/.bashrc"; else profile="$HOME/.bash_profile"; fi ;;
		esac
	fi
	if [ -n "$profile" ] && ! grep -qs -F "$MARK" "$profile"; then
		printf '\n%s\n%s\n' "$MARK" "$line" >>"$profile"
		echo "Added $BIN_DIR to your PATH in $profile. Open a new shell, or run:"
	else
		echo "Add $BIN_DIR to your PATH:"
	fi
	echo "  $line"
fi

echo ""
echo "Next: cd into a project and run  doze up"
echo "Docs: https://doze-dev.com/docs/doze/"
