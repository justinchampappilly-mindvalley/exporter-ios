const tokenMap = {};
let singleThemedColors = {};

const ColorStylesEnum = {
  COLOR_STYLES: "Color Styles",
  EVE_COLOR_STYLES: "Eve Color Styles"
};


class ColorObject {
  constructor(themeId, color, style, name) {
    this.themeId = themeId;
    this.color = color;
    this.style = style;
    this.name = name;
  }

  static fromToken(color, theme, brand) {
    const colorStyle = makeColorStyle(color);
    if (colorStyle !== null) {
      const name = makeColorName(color);
      let colorName = name;
      if (colorStyle === ColorStylesEnum.EVE_COLOR_STYLES && name.includes('GradientBase')) {
        colorName = name.replace('GradientBase', brand + 'GB');
      } else if (colorStyle === ColorStylesEnum.EVE_COLOR_STYLES) {
        colorName = brand + color.name;
      } else if (colorStyle === ColorStylesEnum.COLOR_STYLES) {
        colorName = color.name;
      }
      return new ColorObject(theme.name, color.value, colorStyle, colorName);
    }
    return null;
  }
}

/**
 * Retrieves the color style name from a token object.
 *
 * @param {Object} token - The token object containing property values and properties.
 * @returns {string|null} The name of the matched color style option, or null if no match is found.
 */
function makeColorStyle(token) {
  if (!token || !token.propertyValues || !token.properties) {
    return null;
  }
  
  const collectionId = token.propertyValues.collection;
  if (!collectionId) {
    return null;
  }
  
  // Find the "Collection" property in the properties array
  const collectionProperty = token.properties.find(prop => prop.codeName === "collection");
  if (!collectionProperty || !collectionProperty.options) {
    return null;
  }
  
  // Check if the collection ID matches "Color Styles" or "Eve Color Styles"
  const matchedOption = collectionProperty.options.find(option => 
    option.id === collectionId && (option.name === ColorStylesEnum.COLOR_STYLES || option.name === ColorStylesEnum.EVE_COLOR_STYLES)
  );

  return matchedOption ? matchedOption.name : null;
}

function objectToPrettyJson(object) {
    const seen = new WeakSet();
    return JSON.stringify(object, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    }, 2);
}

/**
 * Groups color tokens by their name from the provided theme data.
 *
 * This function iterates through the themes in the provided theme data and
 * groups color tokens by their name if the theme name is "Dark" or "Light".
 * The grouped tokens are stored in a global `tokenMap` object.
 *
 * @param {Object} themeData - The theme data containing themes and their tokens.
 * @param {string} brand - The brand name to append to color names.
 * @returns {string} An empty string.
 */
function groupTokensByName(themeData, brand) {
  for (const themeKey in themeData) {
    const theme = themeData[themeKey];
    if (theme.name.trim() === "Dark" || theme.name.trim() === "Light") {
      const overriddenTokens = theme.overriddenTokens;
      for (const colorToken in overriddenTokens) {
        const color = overriddenTokens[colorToken];
        const colorObject = ColorObject.fromToken(color, theme, brand);
        if (colorObject) {
          if (!tokenMap[colorObject.name]) {
            tokenMap[colorObject.name] = [];
          }
          tokenMap[colorObject.name].push(colorObject);
        }
      }
    }
  }
  // Preprocess all the colors that only have a single theme to speed up looking them up
  singleThemedColors = getUnThemedColors();
  return "";
}

/**
 * Retrieves the color object for a given color name and theme ID.
 *
 * @param {string} colorName - The name of the color to retrieve.
 * @param {string} themeId - The ID of the theme to match.
 * @returns {Object} The color object that matches the provided theme ID, or the first entry if no match is found.
 */
function getColorsFor(colorName, themeId) {
  const colormap = tokenMap[colorName];
  
  // Check if colormap is defined and is an array
  if (!Array.isArray(colormap) || colormap.length === 0) {
    console.log(`No colormap found for colorName: ${colorName}`);
    return null;
  }
  
  // Use Array.find to get the first entry that matches the provided themeId
  const tokenEntry = colormap.find(item => item.themeId === themeId);
  return tokenEntry || colormap[0];
}

/**
 *
 * Fuction filters colors that do not have any theme
 *
 * @returns {Array<Object>}
 */
function getUnThemedColors() {
  const unthemedColors = {};
  
  for (const colorName in tokenMap) {
    if (!isColorThemed(colorName)) { // Check if the color is NOT themed
      let value = tokenMap[colorName];
      unthemedColors[colorName] = value;
    }
  }
  return unthemedColors;
}


function findColorKey(singleThemedColors, hexCode) {
  for (const key in singleThemedColors) {
    for (const colorObj of singleThemedColors[key]) {
      if (colorObj && colorObj.color && colorObj.color.hex === hexCode) {
          return colorObj.name;
      }
    }
  }
}

function getNameForUnthemedColor(hexCode) {
  const colorName = findColorKey(singleThemedColors, hexCode);
  return colorName;
}

function getColorMap() {
  return tokenMap;
}

/**
 * Retrieves the color name from a color object.
 *
 * @param {Object} colorObject - The color object to retrieve the name from.
 * @returns {string|null} The color name, or null if an error occurs.
 */
function makeColorName(colorObject) {
  try {
    const parent = colorObject.parent;
    const parentName = parent.name;
    const colorName = colorObject.name;
    
    function getOriginName(colorObject) {
      const origin = colorObject.origin;
      if (origin && origin.name) {
        return origin.name.replace(/\//g, "");
      }
      return "";
    }

    const originConCatinatedName = getOriginName(colorObject);

    if (originConCatinatedName) {
      return originConCatinatedName;
    } else {
      return colorName;
    }
  } catch (e) {
    console.log("Error processing color object:", e.message);
    return null;
  }
}

/**
 * Returns an array containing both the tokenIds and childrenIds of a token group.
 *
 * @param {Object} tokenGroup - The token group object.
 *   Expected properties:
 *     - tokenIds: Array of token identifiers.
 *     - childrenIds: Array of child token group identifiers.
 * @returns {Array<string>} - An array containing all IDs.
 */
function getTokenGroupIds(tokenGroup) {
  if (!tokenGroup) {
    return [];
  }
  
  const tokenIds = Array.isArray(tokenGroup.tokenIds) ? tokenGroup.tokenIds : [];
  const childrenIds = Array.isArray(tokenGroup.childrenIds) ? tokenGroup.childrenIds : [];
  
  return tokenIds.concat(childrenIds);
}

function fetchColorStyle(colorName) {
 
  let colorData = tokenMap[colorName];
  if (!Array.isArray(colorData)) {
    return null;
  }
  let matchedOption = null;
  for (const colorObject of colorData) {
    if (colorObject.style === ColorStylesEnum.COLOR_STYLES) {
      matchedOption = ColorStylesEnum.COLOR_STYLES;
      break;
    } else if (colorObject.style === ColorStylesEnum.EVE_COLOR_STYLES) {
      matchedOption = ColorStylesEnum.EVE_COLOR_STYLES;
      break;
    }
  }
  return matchedOption;
}

function isColorAllowed(colorName) {
  return colorName != "Black" && colorName != "White";
}

function isColorStylesToken(colorName) {
  return fetchColorStyle(colorName) !== null;
}

/**
 * Determines if a color has both dark and light theme
 * 
 * @param {string} colorName
 *
 * @returns {boolean}
 */
function isColorThemed(colorName) {
  let entry = tokenMap[colorName];
  if (!Array.isArray(entry)) {
    return false;
  }
  let darkColor = null;
  let lightColor = null;

  for (const colorObject of entry) {
    if (colorObject.themeId === "Dark") {
      darkColor = colorObject.color.hex;
    } else if (colorObject.themeId === "Light") {
      lightColor = colorObject.color.hex;
    }

    if (darkColor && lightColor) {
      break;
    }
  }

  return darkColor !== null && lightColor !== null && darkColor !== lightColor;
}

/**
 * This function will return the current date and time in "yyyy-MM-dd" format.
 */
function getCurrentDate() {
  const date = new Date();
  return date.toISOString().split("T")[0];
}

Pulsar.registerFunction("isColorStylesToken", isColorStylesToken)
Pulsar.registerFunction("groupTokensByName", groupTokensByName)
Pulsar.registerFunction("getColorsFor", getColorsFor)
Pulsar.registerFunction("isColorThemed", isColorThemed)
Pulsar.registerFunction("getColorMap", getColorMap)
Pulsar.registerFunction("isColorAllowed", isColorAllowed)
Pulsar.registerFunction("makeColorName", makeColorName)
Pulsar.registerFunction("getNameForUnthemedColor", getNameForUnthemedColor)
Pulsar.registerFunction("getCurrentDate", getCurrentDate)