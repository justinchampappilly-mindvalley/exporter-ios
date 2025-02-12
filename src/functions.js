const tokenMap = {};
/**
 * 
 * @param {string} text 
 * @param {string} indentationString 
 * 
 * @returns {string}
 */
 function createDocumentationComment(text, indentationString) {
    // Add the [indentationString] to all but the first line
    return text.trim().split("\n").map((line, index) => ((index > 0) ? `${indentationString}` : ``) + `/// ${line}`).join("\n")
}

function isColorStylesToken(token) {
    if (!token || !token.propertyValues || !token.properties) {
        return false;
    }
    
    const collectionId = token.propertyValues.collection;
    if (!collectionId) {
        return false;
    }
    
    // Find the "Collection" property in the properties array
    const collectionProperty = token.properties.find(prop => prop.codeName === "collection");
    if (!collectionProperty || !collectionProperty.options) {
        return false;
    }
    
    // Check if the collection ID matches "Color Styles"
    return collectionProperty.options.some(option => 
        option.id === collectionId && option.name === "Color Styles"
    );
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

function groupTokensByName(themeData) {
  for (const themeKey in themeData) {
    const theme = themeData[themeKey];
    if (theme.name.trim() === "Dark" || theme.name.trim() === "Light") {
      const overriddenTokens = theme.overriddenTokens;
      for (const colorToken in overriddenTokens) {
        const color = overriddenTokens[colorToken];
        if (isColorStylesToken(color)) {
          const name = color.name;
          if (!tokenMap[name]) {
          tokenMap[name] = [];
          }
          tokenMap[name].push({themeId: theme.name, color: color.value});
        }
      }
    }
  }
  return "";
}

function getColorsFor(colorName, themeId) {
    let colormap = tokenMap[colorName]
    
    // Use Array.find to get the first entry that matches the provided themeId
    let tokenEntry = colormap[0];
    for (const itemIndex in colormap) {
      const colorObject = colormap[itemIndex];
      let colorTheme = colorObject.themeId;
       if (colorTheme === themeId) {
          return colorObject;
       }
    }
    return tokenEntry;
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
          return key;
      }
    }
  }
}

function getNameForColor(colorValue) {
  const singleThemedColors = getUnThemedColors();
  const colorName = findColorKey(singleThemedColors, colorValue);
  return colorName;
}

function getColorMap() {
  return tokenMap;
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

Pulsar.registerFunction("createDocumentationComment", createDocumentationComment)
Pulsar.registerFunction("isColorStylesToken", isColorStylesToken)
Pulsar.registerFunction("groupTokensByName", groupTokensByName)
Pulsar.registerFunction("getColorsFor", getColorsFor)
Pulsar.registerFunction("isColorThemed", isColorThemed)
Pulsar.registerFunction("getNameForColor", getNameForColor)
Pulsar.registerFunction("getColorMap", getColorMap)
/*Pulsar.registerFunction("objectToPrettyJson", (object) => {
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
  });
  */