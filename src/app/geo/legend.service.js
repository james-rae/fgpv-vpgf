(() => {
    'use strict';

    /**
     * @module legendService
     * @memberof app.geo
     * @description
     *
     * The `legendService` factory constructs the legend (auto or structured). `LayerRegistry` instantiates `LegendService` providing the current config, layers and legend containers.
     * This service also scrapes layer symbology.
     *
     */
    angular
        .module('app.geo')
        .factory('legendService', legendServiceFactory);

    function legendServiceFactory($translate, $http, $q, $timeout, gapiService, Geo, legendEntryFactory) {

        const legendSwitch = {
            structured: structuredLegendService,
            autopopulate: autoLegendService
        };

        return (config, ...args) => legendSwitch[config.legend.type](config, ...args);

        /**
         * Constrcuts and maintains autogenerated legend.
         * @function autoLegendService
         * @private
         * @param  {Object} config current config
         * @param  {Object} layerRegistry instance of `layerRegistry`
         * @return {Object}        instance of `legendService` for autogenerated legend
         */
        function autoLegendService() { // config, layerRegistry) { // FIXME: remove later if not needed
            // maps layerTypes to layer item generators
            // TODO we may want to revisit this since all the keys can be replaced by constant references
            const layerTypeGenerators = {
                esriDynamic: dynamicGenerator,
                esriFeature: featureGenerator,
                esriImage: imageGenerator,
                esriTile: tileGenerator,
                ogcWms: wmsGenerator
            };

            const service = {
                /**
                 * This is legend's invisible root group; to be consumed by toc
                 * @var legend
                 */
                legend: legendEntryFactory.entryGroup(),

                addLayer,
                addPlaceholder
            };

            return service;

            /***/

            /**
             * Parses a dynamic layer object and creates a legend item (with nested groups and symbology).
             * For a dynamic layer, there are two visibility functions:
             *     - `setVisibility`: https://developers.arcgis.com/javascript/jsapi/arcgisdynamicmapservicelayer-amd.html#setvisibility
             *      sets visibility of the whole layer; if this is set to false, using `setVisibleLayers` will not change anything.
             *
             *  - `setVisibleLayers`: https://developers.arcgis.com/javascript/jsapi/arcgisdynamicmapservicelayer-amd.html#setvisiblelayers
             *      sets visibility of sublayers;
             *
             * A tocEntry for a dynamic layer contains subgroups and leaf nodes, each one with a visibility toggle.
             *  - User clicks on leaf's visibility toggle:
             *      toggle visibility of the leaf's layer item.
             *      notify the root group of this dynamic layer.
             *      walk root's children to find out which leaves are visible, omitting any subgroups.
             *      call `setVisibleLayers` on the layer object to change the visibility of the layer.
             *
             *  - User clicks on subgroup's visibility toggle:
             *      toggle visibility of the subgroup item.
             *      toggle all its children (prevent children from notifying the root when they are toggled).
             *      notify the root group of this dynamic layer.
             *      walk root's children to find out which leaves are visible, omitting any subgroups.
             *      call `setVisibleLayers` on the layer object to change the visibility of the layer.
             *
             *  - User clicks on root's visibility toggle:
             *      toggle all its children (prevent children from notifying the root when they are toggled).
             *      walk root's children to find out which leaves are visible, omitting any subgroups.
             *      call `setVisibleLayers` on the layer object to change the visibility of the layer.
             *
             * @function dynamicGenerator
             * @private
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function dynamicGenerator(layer) {
                const state = legendEntryFactory.dynamicEntryMasterGroup(layer.config, layer, false);
                layer.legendEntry = state;

                // TODO: consider using the layerRegistry[layer.id].attributeBundle[featureIdx].layerInfo.then.legend instead of web call
                //       this logic would be inside the loop over all valid slaves (there is one .layerInfo for each leaf layer)
                const symbologyPromise = getMapServerSymbology(state.url);

                // wait for symbology to load and ...
                symbologyPromise.then(data =>  // ... and apply them to existing child items
                        data.layers.forEach(layer => applySymbology(state.slaves[layer.layerId], layer)));

                // assign feature counts only to active sublayers
                state.walkItems(layerEntry => {
                    getServiceFeatureCount(`${state.url}/${layerEntry.featureIdx}`).then(count =>
                        // FIXME _layer reference is bad
                        applyFeatureCount(layer._layer.geometryType, layerEntry, count));
                });

                return state;
            }

            /**
             * Parses a tile layer object and creates a legend item (with nested groups and symbology).
             * Uses the same logic as dynamic layers to generate symbology hierarchy.
             * @function tileGenerator
             * @private
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function tileGenerator(layer) {
                const state = legendEntryFactory.singleEntryItem(layer.config, layer);
                layer.legendEntry = state;

                return state;
            }

            /**
             * Parses feature layer object and create a legend entry with symbology.
             * @function featureGenerator
             * @private
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function featureGenerator(layer) {
                // generate toc entry
                const state = legendEntryFactory.singleEntryItem(layer.config, layer);
                layer.legendEntry = state;

                // HACK: to get file based layers working; this will be solved by the layer record ana legend entry hierarchy
                // TODO: file based layers need to have their symbology generated
                // TODO: consider using the layerRegistry[layer.id].attributeBundle[featureIdx].layerInfo.then.legend instead of web call
                if (typeof state.url !== 'undefined') {
                    const symbologyPromise = getMapServerSymbology(state.url);

                    symbologyPromise.then(data =>
                        applySymbology(state, data.layers[state.featureIdx]));

                    // assign feature count
                    // FIXME _layer call is bad
                    getServiceFeatureCount(`${state.url}/${state.featureIdx}`).then(count =>
                        applyFeatureCount(layer._layer.geometryType, state, count));
                }

                return state;
            }

            /**
             * Parses esri image layer object and create a legend entry with symbology.
             * @function imageGenerator
             * @private
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function imageGenerator(layer) {
                // generate toc entry
                const state = legendEntryFactory.singleEntryItem(layer.config, layer);
                layer.legendEntry = state;

                return state;
            }

            /**
             * Parses WMS layer object and create a legend entry with symbology.
             * @function wmsGenerator
             * @private
             * @param  {Object} layer layer object from `layerRegistry`
             * @return {Object}       legend item
             */
            function wmsGenerator(layer) {
                const state = legendEntryFactory.singleEntryItem(layer.config, layer);
                state.symbology = gapiService.gapi.layer.ogc
                    .getLegendUrls(layer._layer, state.layerEntries.map(le => le.id))
                    .map((url, idx) => {
                        // jscs:disable maximumLineLength
                        // FIXME remove the horrible URL when the TODO in entry-symbology.html is complete (icon should then be null / undefined)
                        return { name: state.layerEntries[idx].name || state.layerEntries[idx].id, icon: url || 'data:image/png;base64,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' };
                        // jscs:enable maximumLineLength
                    });
                layer.legendEntry = state;

                return state;
            }

            /**
             * Add a placeholder for the provided layer.
             *
             * @function addPlaceholder
             * @param {Object} layerRecord object from `layerRegistry` `layers` object
             */
            function addPlaceholder(layerRecord) {
                const entry = legendEntryFactory.placeholderEntryItem(layerRecord.config, layerRecord);
                layerRecord.legendEntry = entry;

                // find a position where to insert new placeholder based on its sortGroup value
                let position = service.legend.items.findIndex(et => et.sortGroup > entry.sortGroup);
                position = position !== -1 ? position : undefined;
                position = service.legend.add(entry, position);

                console.log(`Inserting placeholder ${entry.name} ${position}`);
                const listener = state => {
                    console.info(`Placeholder listener fired ${state} ${layerRecord.layerId}`);
                    if (state === Geo.Layer.States.LOADED) {
                        layerRecord.removeStateListener(listener);
                        entry.unbindListeners();
                        // swap the placeholder with the real legendEntry
                        const index = service.legend.remove(entry);
                        addLayer(layerRecord, index);
                    }
                };
                layerRecord.addStateListener(listener);

                return position;
            }

            /**
             * Add a provided layer to the appropriate group.
             *
             * TODO: hide groups with no layers.
             * @function addLayer
             * @param {Object} layer object from `layerRegistry` `layers` object
             * @param {Number} index position to insert layer into the legend
             */
            function addLayer(layer, index) {
                const layerType = layer.config.layerType;
                const entry = layerTypeGenerators[layerType](layer);

                console.log(`Inserting legend entry ${entry.name} ${index}`);

                service.legend.add(entry, index);
            }
        }

        // TODO: maybe this should be split into a separate service; it can get messy otherwise in here
        function structuredLegendService() {

        }

        /**
         * TODO: Work in progress... Works fine for feature layers only right now; everything else gest a generic icon.
         * TODO: move to geoapi as it's stateless and very specific.
         * Scrapes feaure and dynamic layers for their symbology.
         *
         * @function getMapServerSymbology
         * @param  {String} layerUrl service url
         * @returns {Array} array of legend items
         */
        function getMapServerSymbology(layerUrl) {
            return $http.jsonp(`${layerUrl}/legend?f=json&callback=JSON_CALLBACK`)
                .then(result => {
                    // console.log(legendUrl, index, result);

                    if (result.data.error) {
                        return $q.reject(result.data.error);
                    }
                    return result.data;
                })
                .catch(error => {
                    // TODO: apply default symbology to the layer in question in this case
                    console.error(error);
                });
        }

        /**
         * Get feature count from a layer.
         * @function getServiceFeatureCount
         * @param  {String} layerUrl layer url
         * @return {Promise}          promise resolving with a feature count
         */
        function getServiceFeatureCount(layerUrl, finalTry = false) {
            return $http.jsonp(
                `${layerUrl}/query?where=1=1&returnCountOnly=true&returnGeometry=false&f=json&callback=JSON_CALLBACK`)
                .then(result => {
                    if (result.data.count) {
                        return result.data.count;
                    } else if (!finalTry) {
                        return getServiceFeatureCount(layerUrl, true);
                    } else {
                        return $translate.instant('toc.error.resource.countfailed');
                    }
                });
        }

        /**
         * Applies feature count to the toc entries.
         * @function applyFeatureCount
         * @param  {String} geometryType one of geometry types
         * @param  {Object} state legend entry object
         * @param  {Number} count  number of features in the layer
         */
        function applyFeatureCount(geometryType, state, count) {
            state.features.count = count;

            $translate(Geo.Layer.Esri.GEOMETRY_TYPES[geometryType]).then(type =>
                state.features.type = type.split('|')[state.features.count > 1 ? 1 : 0]);
        }

        /**
         * Applies retrieved symbology to the layer item's state.
         * @function applySymbology
         * @param  {Object} state     layer item
         * @param  {Object} layerData data from the legend endpoint
         */
        function applySymbology(state, layerData) {
            state.symbology = layerData.legend.map(item => {
                return {
                    icon: `data:${item.contentType};base64,${item.imageData}`,
                    name: item.label
                };
            });
        }
    }
})();
