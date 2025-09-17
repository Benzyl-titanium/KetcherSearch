<img src="public/ketchersearch_logo.svg" alt="KetcherSearch logo" width="100" height="100" align="right" />

# KetcherSearch

<p align="center">
   English |  <a href="README_zh-CN.md">简体中文</a>
</p>

Pure front-end implementation of smiles⇄mol based on Ketcher Searching for compound information from molecular structures

Powered by [Ketcher](https://github.com/epam/ketcher) & [KetchKitSearch](https://github.com/biantailab/KetchKitSearch)

## Dependencies

- [pubchem](https://pubchem.ncbi.nlm.nih.gov)
- [nmrdb](https://www.nmrdb.org)

> [!tip]
> DrugBank exact and Wikipedia jump links from PubChem JSON

- [drugbank](https://go.drugbank.com)
- [wikipedia](https://en.wikipedia.org)

## Demo

<img src="imgs/ketchersearch.gif" >

## Functionality

- Real-time conversion of smiles and mol
- Example:
    - Benzyl titanium
    - Pregabalin
    - Fluoxetine
- Clear smiles
- Copy smiles
- Get:
    - CAS
    - IUPACName
    - Molecular Formula
- HNMR search
- PubChem search
- Wikipedia search
- DrugBank search
    - exact
    - fuzzy

## More

- [StructuredSearch](https://github.com/biantailab/StructuredSearch) - Searching for compound information from molecular structures based on Marvin JS and web services