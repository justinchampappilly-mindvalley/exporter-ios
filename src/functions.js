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

function isValidPath(path) {
    return path.includes("Still") || path.includes("Set") || path.includes("LightUI") || path.includes("DarkUI");
}

function groupTokensByName(tokens, pathName) {
    if (!isValidPath(pathName)) return ""; 

    let themeID = "LightUI"
    if (pathName.includes("LightUI")) {
        themeID = "LightUI";
    } else if (pathName.includes("DarkUI")) {
        themeID = "DarkUI";
    }
    tokens.forEach(token => {
        const name = token.name;
        const colorValue = token.value || "Unknown"; // Extract hex color
    
        // Initialize the map entry as an array if not present
        if (!tokenMap[name]) {
          tokenMap[name] = [];
        }
        
        // Check if an object with the same colorValue and themeID already exists
        const exists = tokenMap[name].some(item => item.color === colorValue && item.themeId === themeID);
        if (!exists) {
          tokenMap[name].push({ color: colorValue, themeId: themeID });
        }
    });
    return "";    
}

function getColorsFor(tokenName, themeID) {
    let colormap = tokenMap[tokenName]

    // Use Array.find to get the first entry that matches the provided themeId
    const tokenEntry = colormap.find(entry => entry.themeId === themeID);

    return tokenEntry ? tokenEntry : colormap[0]
}


/**
 *
 * @param {{name: string, isRoot: boolean, path: Array<string>}} tokenGroup
 *
 * @returns {Array<string>}
 */
function createFullTokenGroupPath(tokenGroup) {
    if (tokenGroup.isRoot || tokenGroup.isNonVirtualRoot) {
      return [];
    } else {
      return tokenGroup.path.concat(tokenGroup.name);
    }
}

Pulsar.registerFunction("createDocumentationComment", createDocumentationComment)
Pulsar.registerFunction("isColorStylesToken", isColorStylesToken)
Pulsar.registerFunction("groupTokensByName", groupTokensByName)
Pulsar.registerFunction("createFullTokenGroupPath",createFullTokenGroupPath)
Pulsar.registerFunction("getColorsFor", getColorsFor)
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