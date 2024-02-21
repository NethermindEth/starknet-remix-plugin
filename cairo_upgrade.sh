git rm -r api/cairo_compilers/v*

git submodule add https://github.com/starkware-libs/cairo api/cairo_compilers/v2.5.0
git submodule add https://github.com/starkware-libs/cairo api/cairo_compilers/v2.5.1
git submodule add https://github.com/starkware-libs/cairo api/cairo_compilers/v2.5.2
git submodule add https://github.com/starkware-libs/cairo api/cairo_compilers/v2.5.3
git submodule add https://github.com/starkware-libs/cairo api/cairo_compilers/v2.5.4

cd api/cairo_compilers/v2.5.0
git checkout 2.5.0
cd ../../../

cd api/cairo_compilers/v2.5.1
git checkout 2.5.1
cd ../../../

cd api/cairo_compilers/v2.5.2
git checkout 2.5.2
cd ../../../

cd api/cairo_compilers/v2.5.3
git checkout 2.5.3
cd ../../../

cd api/cairo_compilers/v2.5.4
git checkout 2.5.4
cd ../../../

git add -A
git submodule update --init --recursive

git add -A
git commit -m "Add cairo compilers v2.5.2, v2.5.3, v2.5.4"