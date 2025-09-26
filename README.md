# Iconpack Kickstarter

Kickstarter extension for [EXT:iconpack](https://github.com/quellenform/t3x-iconpack), which allows you to create your own icon pack for use in TYPO3. All you need is your icons in SVG format and `npm`. The result is a ready-to-use iconpack that includes all necessary formats (svgInline, svgSprite, svg, and webfont).

## How to use this kickstarter?

1. Clone this repository
2. Choose a unique and short identifier for your iconpack. Pick this value carefully, as it will be used in the database.
3. Copy your SVG icons to the path *Build/Sources/Svg/*.
4. Edit the file *Build/package.json* and fill in the following data according to your preferences:
   ```json
   "iconpack": {
     "family":  "My First Iconpack",       // Name of the conpack & font name (also used in BE dropdowns)
     "file":    "myfirsticonpack",         // Base name of the generated files
     "key":     "mfi",                     // Unique conpack key (!)
     "version": "0.0.1",                   // Version of your iconpack
     "ext":     "iconpack_myfirsticonpack" // Extension name for TYPO3 (should start with "iconpack_*")
   }
   ```
5. Install the necessary packages:
   ```
   npm install --save-dev
   ````
6. Create your own custom icon pack with the following command:
   ```
   grunt build
   ```
   This creates your iconpack in *Resources/Public/Iconpack/*, as well as the necessary YAML configuration in *Configuration/Iconpack/Iconpack.yaml*.
7. Then edit the files in the root directory of the extension (*ext_localconf.php*, *ext_emconf.php*, *composer.json*, etc.) and change their content as desired.
