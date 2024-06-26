'use strict';

// ugly way to add rgbcolor to global scope so it can be used by canvg inside the viewer; this is done because canvg uses UMD loader and has rgbcolor as internal dependency; there is no elegant way around it; another approach would be to clone canvg and change its loader;
window.RGBColor = require('rgbcolor');
const canvg = require('canvg-origin');
const shared = require('../shared.js')();

const XML_ATTRIBUTES = {
    xmlns: 'http://www.w3.org/2000/svg',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    version: '1.1',
};

/**
 * The `mapPrint` module provides map print and export image related functions.
 *
 * This module exports an object with the following functions
 * - `printMap`
 *
 * NOTE: unit tests might be difficult to implement as DOM is required...
 */

/**
 * Generate the image from the esri print task
 *
 * @param {Object} esriBundle bundle of API classes
 * @param {Object} map esri map object
 * @param {Object} options options for the print task
 *                           url - for the esri geometry server
 *                           format - output format
 *                           width - target image height if different from default
 *                           height - target image width if different from default
 * @return {Promise} resolving when the print task created the image
 *                           resolve with a "response: { url: value }" where url is the path
 *                           for the print task export image
 */
function generateServerImage(esriBundle, map, options) {
    // create esri print object with url to print server
    const printTask = esriBundle.PrintTask(options.url, { async: true });
    const printParams = new esriBundle.PrintParameters();
    const printTemplate = new esriBundle.PrintTemplate();

    // each layout has an mxd with that name on the server. We can modify and add new layout (mxd)
    // we only support MAP_ONLY for now. See https://github.com/fgpv-vpgf/fgpv-vpgf/issues/1160
    printTemplate.layout = 'MAP_ONLY';

    // only use when layout is MAP_ONLY
    printTemplate.exportOptions = {
        height: options.height || map.height,
        width: options.width || map.width,
        dpi: 96,
    };

    // pdf | png32 | png8 | jpg | gif | eps | svg | svgz
    printTemplate.format = options.format;
    printTemplate.showAttribution = false;

    // define whether the printed map should preserve map scale or map extent.
    // if true, the printed map will use the outScale property or default to the scale of the input map.
    // if false, the printed map will use the same extent as the input map and thus scale might change.
    // we always use false because the output image needs to be of the same extent as the size might be different
    // we fit the image later because trying to fit the image with canvg when we add user added
    // layer is tricky!
    printTemplate.preserveScale = false;

    // set map and template
    printParams.map = map;
    printParams.template = printTemplate;

    // need to hide svg layers since we can generate an image for them locally
    const svgLayers = hideLayers(map);

    const printPromise = new Promise((resolve, reject) => {
        // can be use to debug print task. Gives parameters to call directly the print task from it's interface
        // http://resources.arcgis.com/en/help/rest/apiref/exportwebmap_spec.html
        // http://snipplr.com/view/72400/sample-json-representation-of-an-esri-web-map-for-export-web-map-task
        // const mapJSON = printTask._getPrintDefinition(map, printParams);
        // console.log(JSON.stringify(mapJSON));

        // monkey-patch printTaks handler to detect 'esriJobFailed' errors which are otherwise not acted upon
        // `esriJobFailed` does not trigger the complete or the error event. Need a way to catch it!
        const originalHandler = printTask._handler;
        printTask._handler = function (a, e, f, b, c) {
            if (a.jobStatus === 'esriJobFailed') {
                // if the job has failed, call errorHandler right away
                printTask._errorHandler.apply(printTask, [a, b, c]);
                return;
            }

            // if not, pass on to the original handler function
            originalHandler.apply(printTask, arguments);
        };

        // execute the print task
        printTask.execute(
            printParams,
            (response) => resolve(shared.convertImageToCanvas(response.url)),
            (error) => reject(error)
        );
    });

    // show user added previously visible for canvg to create canvas
    showLayers(svgLayers);

    return printPromise;
}

/**
 * Set svg-based layer visibility to false to avoid CORS error
 *
 * @param {Object} map esri map object
 * @return {Array} layer array of layers where visibility is true
 */
function hideLayers(map) {
    return map.graphicsLayerIds
        .map((layerId) => map.getLayer(layerId))
        .filter((layer) => layer.visible)
        .map((layer) => {
            layer.setVisibility(false);
            return layer;
        });
}

/**
 * Set user added layer visibility to true for those whoe where visible
 *
 * @param {Array} layers array of graphic layers to set visibility to true
 */
function showLayers(layers) {
    layers.forEach((layer) => layer.setVisibility(true));
}

/**
 * Create a canvas from the user added layers (svg tag)
 *
 * @param {Object} map esri map object
 * @param {Object} options [optional = null] { width, height } values; needed to get canvas of a size different from default
 *                           width {Number}
 *                           height {Number}
 * @param {Object} canvas [optional = null] canvas to draw the image upon; if not supplied, a new canvas will be made
 * @return {Promise} resolving when the canvas have been created
 *                           resolve with a canvas element with user added layer on it
 */
function generateLocalCanvas(map, options = null, canvas = null) {
    canvas = canvas || window.document.createElement('canvas'); // create canvas element

    // find esri map's svg node
    // check if xmlns prefixes are set - they aren't; add them
    // without correct prefixes, Firefox and IE refuse to render svg onto the canvas; Chrome works;
    // related issues: fgpv-vpgf/fgpv-vpgf#1324, fgpv-vpgf/fgpv-vpgf#1307, fgpv-vpgf/fgpv-vpgf#1306
    const svgNode = document.getElementById(`esri\.Map_${map.id.split('_')[1]}_gc`);
    // Clone the svg node (and all its children)
    // this allows us to mess with the width, height, viewBox, etc. without changing the visible layer on the map
    const svgNodeClone = svgNode.cloneNode(true);
    if (!svgNodeClone.getAttribute('xmlns')) {
        Object.entries(XML_ATTRIBUTES).forEach(([key, value]) => svgNodeClone.setAttribute(key, value));
    }

    if (options) {
        resizeSVGElement(svgNodeClone, options);
    }

    const generationPromise = new Promise((resolve, reject) => {
        // parse the svg
        // convert svg text to canvas and stuff it into canvas canvas dom node

        // wrapping in try/catch since canvg has NO error handling; not sure what errors this can catch though
        try {
            // convert svg to text (use map id to select the svg container), then render svgxml back to canvas
            canvg(canvas, svgNodeClone.outerHTML, {
                useCORS: true,
                ignoreAnimation: true,
                ignoreMouse: true,
                renderCallback: () => {
                    resolve(canvas);
                },
            });
        } catch (error) {
            reject(error);
        }
    });

    return generationPromise;

    /**
     * Scales up or down the specified svg element. To scale it, we need to set the viewbox to the current size and change the size of the element itself.
     * @function resizeSVGElement
     * @private
     * @param {Object} element target svg element to be resized
     * @param {Object} targetSize object with target sizes in the form of { width, height }
     *                           width {Number}
     *                           height {Number}
     * @param {Object} targetViewbox [optional = null] target viewbox sizes in the form of { minX, minY, width, height }; if not specified, the original size will be used as the viewbox
     *                           minX {Number}
     *                           minxY {Number}
     *                           width {Number}
     *                           height {Number}
     * @return {Object} returns original size and viewbox of the svg element in the form of { originalSize: { width, height }, originalViewbox: { minX, minY, width, height } }; can be used to restore the element to its original state
     *                          originalSize:
     *                              width {Number}
     *                              height {Number}
     *                          originalViewbox:
     *                              minX {Number}
     *                              minxY {Number}
     *                              width {Number}
     *                              height {Number}
     */
    function resizeSVGElement(element, targetSize, targetViewbox = null) {
        const originalSize = {
            width: element.width.baseVal.value,
            height: element.height.baseVal.value,
        };

        // get the current viewbox sizes
        // if the viewbox is not defined, the viewbox is assumed to have the same dimensions as the svg element
        // getAttribute('viewBox') returns a string in the form '{minx} {miny} {width} {height}'
        // setAttribute('viewBox') accepts a string in the same form
        const [ovMinX, ovMinY, ovWidth, ovHeight] = (
            element.getAttribute('viewBox') || `0 0 ${originalSize.width} ${originalSize.height}`
        ).split(' ');

        const originalViewbox = {
            minX: ovMinX,
            minY: ovMinY,
            width: ovWidth,
            height: ovHeight,
        };

        // set the width/height of the svg element to the target values
        element.setAttribute('width', targetSize.width);
        element.setAttribute('height', targetSize.height);

        // set the viewbox width/height of the svg element to the target values; or the values of the original viewbox (if the viewbox wasn't defined before, it is now)
        element.setAttribute(
            'viewBox',
            [
                (targetViewbox || originalViewbox).minX,
                (targetViewbox || originalViewbox).minY,
                (targetViewbox || originalViewbox).width,
                (targetViewbox || originalViewbox).height,
            ].join(' ')
        );

        return {
            originalSize,
            originalViewbox,
        };
    }
}

// Print map related modules
module.exports = (esriBundle) => {
    return {
        printLocal: (map, options) => generateLocalCanvas(map, options),
        printServer: (map, options) => generateServerImage(esriBundle, map, options),
    };
};
