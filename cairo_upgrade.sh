git rm -r api/cairo_compilers/v*

versions=(2.6.0 2.6.1 2.6.2 2.6.3)

for version in "${versions[@]}"
do
    echo $version
    git submodule add https://github.com/starkware-libs/cairo api/cairo_compilers/v$version
    cd api/cairo_compilers/v$version
    git checkout $version
    cd ../../../
done

git add -A
git submodule update --init --recursive

git add -A
git commit -m "Add cairo compilers ${versions[*]}"
