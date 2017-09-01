/**
 * #### Event based with MVCObject & MVCArray
 * 
 * Both API users and our backend API implementation will rely on events to signal changes. When a user changes certain properties in the API
 * an event is triggered in the core viewer. Likewise, any backend API changes trigger events which API users can listen to.
 * 
 * Available events are documented throughout this API. 
 * 
 * `MVCObject` & `MVCArray` are custom implementations based off similar Google MVC object designs.
 * 
 */

export declare module RV {
    /**
     * Defines a basemap which is selectable from the basemap panel once added to the map. For example:
     * 
     * ```js
     * var myBasemap = new RV.Basemap('My Custom Basemap', 'A personal favorite of mine.', [myLayer1, myLayer2]);
     * myBasemap.setActive(true); // make active so it is displayed when added.
     * mapInstance.basemaps.push(myBasemap);
     * ```
     * 
     * Note that whenever passing string layer ids in place of Layer instances they will be converted to Layer instances automatically.
     * 
     * @example <br><br>
     * 
     * ```js
     * var firstBasemap = mapInstance.basemaps.getAt(0);
     * firstBasemap.addListener('active_changed', function(isActive) {
     *     if (isActive) {
     *         firstBasemap.setName('Active Basemap');
     *     }
     * });
     * ```
     */
    export class Basemap extends MVCObject {
        /** @param layers - string values must be layer ids as defined in the configuration. Use Layer instances in most cases. */
        constructor(name: string, layers: Array<Data.Layer> | Array<string> | Data.Layer | string, description?: string);
        getName(): string;
        setName(name: string): void;
        getDescription(): string;
        setDescription(desc: string): void;
        /** Returns true if this basemap is currently shown on the map. */
        isActive(): boolean;
        setActive(active: boolean): void;
        /** Derived from the layer projections that compose this basemap. You cannot set a projection. */
        getProjection(): Projection;
        
        /**
         * @event name_changed
         * @property {string} name - The new name
         */
        name_changed: Event;

        /**
         * @event description_changed
         * @property {string} description - The new description
         */
        description_changed: Event;

        /**
         * @event active_changed
         * @property {string} isActive
         */
        active_changed: Event;
    }

    /** A map instance is needed for every map on the page. To display `x` number of maps at the same time, you'll need `x` number of map instances,
     * with separate div containers for each one.
     * 
     * @example <br><br>
     * 
     * ```js
     * var mapInstance = new Map(document.getElementById('map'));
     * ```
     */
    export class Map extends MVCObject {
        /** Creates a new map inside of the given HTML container, which is typically a DIV element. */
        constructor(mapDiv: HTMLElement, opts?: MapOptions);

        basemaps: MVCArray<Basemap>;

        /** 
         * The `data` object is a collection of Layers. 
         * 
         * Every Map has a `data` object by default, so there is no need to initialize one.
         * 
         * @example #### Add geoJSON & getting a layer by its ID <br><br>
         * 
         * ```js
         * var mapInstance = new RV.Map(...);
         * mapInstance.data.addGeoJson(...);
         * mapInstance.data.getLayerById(...); 
         * ```
         */
        data: Data.DataRegistry;

        /** Returns the position displayed at the center of the map.  */
        setCenter(latlng: LatLng | LatLngLiteral) : void;
        setZoom(zoom: number) : void;
        /** Changes the center of the map to the given LatLng. If the change is less than both the width and height of the map, the transition will be smoothly animated. */
        panTo(latLng: LatLng | LatLngLiteral) : void;
        /** Changes the center of the map by the given distance in pixels. If the distance is less than both the width and height of the map, the transition will be smoothly animated.  */
        panBy(x: number, y: number) : void;
        getZoom(): number;
        /** Returns the current Projection, based on currently active basemap projection. */
        getProjection(): Projection;
        getDiv(): HTMLElement;
        getCenter(): LatLng;
        getBounds(): LatLngBounds;
        /** Puts the map into full screen mode when enabled is true, otherwise it cancels fullscreen mode. */
        fullscreen(enabled: boolean) : void;

        /** 
         * This event is fired when the viewport boundary changes.
         * @event bounds_changed
         * @property {LatLngBounds} newBounds
         */
        bounds_changed: Event;

        /** 
         * This event is fired when the map center property changes.
         * @event center_changed
         * @property {latlng} newLatLng
         */
        center_changed: Event;

        /** 
         * This event is fired when the user clicks on the map, but does not fire for clicks on panels or other map controls.
         * @event click
         * @property {Event.MouseEvent} event
         */
        click: Event;

        /** 
         * This event is fired when the users mouse moves over the map, but does not fire for movement over panels or other map controls.
         * @event mousemove
         * @property {Event.MouseEvent} event
         */
        mousemove: Event;

        /** 
         * This event is fired when the map projection changes.
         * @event projection_changed
         * @property {Projection} projection
         */
        projection_changed: Event;

        /** 
         * This event is fired when the maps zoom level changes.
         * @event zoom_changed
         * @property {number} zoom
         */
        zoom_changed: Event;

        /** 
         * This event is fired when the legend type changes from auto to structured or vice-versa.
         * @event legend_changed
         */
        legend_changed: Event;
    }

    /** A LatLngBounds instance represents a rectangle in geographical coordinates. */
    export class LatLngBounds {
        /** Constructs a rectangle from the points at its south-west and north-east corners. */
        constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
        /** Returns true if the given lat/lng is in this bounds. */
        contains(latLng: LatLng | LatLngLiteral): boolean;
        equals(other:LatLngBounds | LatLngBoundsLiteral): boolean;
        /** Extends this bounds to contain the given point. */
        extend(point:LatLng|LatLngLiteral): LatLngBounds;
        /** Computes the center of this LatLngBounds. */
        getCenter(): LatLng;
        /** Returns the north-east corner of this bounds. */
        getNorthEast(): LatLng;
        /** Returns the south-west corner of this bounds. */
        getSouthWest(): LatLng;
        /** Returns true if this bounds shares any points with the other bounds. */
        intersects(other: LatLngBounds | LatLngBoundsLiteral): boolean;
        /** Returns if the bounds are empty. */
        isEmpty(): boolean;
        /** Converts to JSON representation. This function is intended to be used via JSON.stringify. */
        toJSON(): LatLngBoundsLiteral
        /** Converts to string. */
        toString(): string;
        /** Returns a string of the form "lat_lo,lng_lo,lat_hi,lng_hi" for this bounds, where "lo" corresponds to the southwest corner of the bounding box, while "hi" corresponds to the northeast corner of that box. */
        toUrlValue(precision?:number): string;
        /** Extends this bounds to contain the union of this and the given bounds. */
        union(other: LatLngBounds | LatLngBoundsLiteral): LatLngBounds;
    }

    /** Object literals are accepted in place of LatLngBounds objects throughout the API. These are automatically converted to LatLngBounds objects. All south, west, north and east must be set, otherwise an exception is thrown. */
    export interface LatLngBoundsLiteral {
        /** East longitude in degrees. */
        east: number;
        /** North latitude in degrees. */
        north: number;
        /** South latitude in degrees. */
        south: number;
        /** West longitude in degrees. */
        west: number;
    }

    export interface MapOptions {
        zoomControl: boolean;
        fullscreenControl: boolean;
        geoLocationControl: boolean;
        helpCtonrol: boolean;
        homeControl: boolean;
    }

    export interface Projection {
        /** Translates from the LatLng cylinder to the Point plane. This interface specifies a function which implements translation from given LatLng values to world coordinates on the map projection. The Maps API calls this method when it needs to plot locations on screen. Projection objects must implement this method. */
        fromLatLngToPoint(latLng: LatLng, point?: Point);
        /** This interface specifies a function which implements translation from world coordinates on a map projection to LatLng values. The Maps API calls this method when it needs to translate actions on screen to positions on the map. Projection objects must implement this method. */
        fromPointToLatLng(pixel: Point, nowrap?: boolean);
    }

    export class Point {
        constructor(x: number, y: number);
        /** Compares two Points. */
        equals(other: Point): boolean;
        /** Returns a string representation of this Point. */
        toString(): string;
        /** The X coordinate */
        x: number;
        /** The Y coordinate */
        y: number;
    }

    export class LatLng  {
        /** Creates a LatLng object representing a geographic point. */
        constructor(lat: number, lng: number);
        /** Comparison function. */
        equals(other:LatLng): boolean;
        /** Returns the latitude in degrees. */
        lat(): number;
        /** Returns the longitude in degrees. */
        lng();
        /** Converts to JSON representation. This function is intended to be used via JSON.stringify. */
        toJSON(): LatLngLiteral;
        /** Converts to string representation. */
        toString(): string;
        /** Returns a string of the form "lat,lng" for this LatLng. We round the lat/lng values to 6 decimal places by default. */
        toUrlValue(precision?: number): string;
    }

    export interface LatLngLiteral {
        /** Latitude in degrees. */
        lat: number;
        /** Longitude in degrees. */
        lng: number;
    }

    export class Accessor {
        target: MVCObject;
        targetKey: string;
        constructor(target: MVCObject, targetKey: string);
    }


    /** The MVCObject constructor is guaranteed to be an empty function, and so you may inherit from MVCObject by simply writing `MySubclass.prototype = new google.maps.MVCObject();`. Unless otherwise noted, this is not true of other classes in the API, and inheriting from other classes in the API is not supported. */
    export class MVCObject {
        /** 
         * Adds the given listener function to the given event name. 
         * Returns an identifier for this listener that can be used with RV.event.removeListener. 
         * 
         * @see {@link RV.event.addListener}
         * */
        addListener(eventName: string, handler: Function): MapsEventListener;
        /** Returns the value of the property specified by 'key' */
        get(key: string): any;
        /** Sets 'value' to 'key' on 'this'. */
        set(key: string, value?: any): MVCObject;
        /** Generic handler for state changes. Override this in derived classes to handle arbitrary state changes. 
         * @example <br><br>
         * ```js
         * var m = new MVCObject();
         * m.changed = sinon.spy();
         * m.set('k', 1);
         * m.changed.should.have.been.calledOnce;
         * ```
        */
        changed(...args: any[]): void;
        /** Notify all observers of a change on this property. This notifies both objects that are bound to the object's property as well as the object that it is bound to. */
        notify(key: string): MVCObject;
        /** Sets a collection of key-value pairs. */
        setValues(values: any): MVCObject;
        /** Updates value of target.targetKey to this.key whenever it is updated.  */
        bindTo(key: string, target: MVCObject, targetKey?: string, noNotify?: boolean): MVCObject;
        /** Removes a binding. */
        unbind(key: string): MVCObject;
        /** Removes all bindings. */
        unbindAll(): MVCObject;
    }

    export interface MapsEventListener {
        /** Removes the listener. Calling listener.remove() is equivalent to RV.event.removeListener(listener). */
        remove(): void;
    }

    export class MVCArray<A> extends MVCObject {
        constructor(array?: Array<A>);
        /** Removes all elements from the array. */
        clear();
        /** Iterate over each element, calling the provided callback. The callback is called for each element like: callback(element, index). */
        forEach(callback: (element: A, index: number) => void);
        /** Returns a reference to the underlying Array. Warning: if the Array is mutated, no events will be fired by this object. */
        getArray(): Array<A>;
        /** Returns the element at the specified index. */
        getAt(i:number): A;
        /** Returns the number of elements in this array. */
        getLength(): number;
        /** Inserts an element at the specified index. */
        insertAt(i: number, elem: A);
        /** Removes the last element of the array and returns that element. */
        pop(): A;
        /** Adds one element to the end of the array and returns the new length of the array. */
        push(elem: A): number;
        /** Removes an element from the specified index. */
        removeAt(i:number): A;
        /** Sets an element at the specified index. */
        setAt(i:number, elem: A);

        /** 
         * This event is fired when insertAt() is called. The event passes the index that was passed to insertAt().
         * @event insert_at
         * @property {number} index
         */
        insert_at: Event;

        /** 
         * This event is fired when removeAt() is called. The event passes the index that was passed to removeAt() and the element that was removed from the array.
         * @event remove_at
         * @property {number} index
         * @property {any} element
         */
        remove_at: Event; 
        /** 
         * This event is fired when setAt() is called. The event passes the index that was passed to setAt() and the element that was previously in the array at that index.
         * @event set_at
         * @property {number} index
         * @property {any} element
         */
        set_at: Event;
    }

    /**
     * Map data is a collection of layers. 
     * 
     * @todo Discuss how the use of a standard layer integrates with our internal implementation of multiple layer types. <br><br>
     * 
     * There is only one type of layer. Each layer can have differing geometry ("Points", "Lines" etc).
     */
    export module Data {

        export class DataRegistry extends MVCObject {
            /** Adds a layer to the collection, and returns the added layer.
             * 
             * If the layer has an ID, it will replace any existing layer in the collection with the same ID. If no layer or JSON is given, a new layer will be created with null geometry and no properties.
             * 
             * Note that the IDs 1234 and '1234' are equivalent. Adding a layer with ID 1234 will replace a layer with ID '1234', and vice versa.
             */
            add(layer?: Data.Layer | JSON): Data.Layer;
            /** Adds GeoJSON layers to the collection. Give this method a parsed JSON. The imported layers are returned. Throws an exception if the GeoJSON could not be imported. */
            addGeoJson(geoJson: Object): Array<Data.Layer>;
            /** Checks whether the given layer is in the collection. */
            contains(layer: Data.Layer): boolean;
            /** Repeatedly invokes the given function, passing a layer in the collection to the function on each invocation. The order of iteration through the layers is undefined. */
            forEach(callback: (layer: Data.Layer) => void);
            /** Returns the layer with the given ID, if it exists in the collection. Otherwise returns undefined.
             * 
             * Note that the IDs 1234 and '1234' are equivalent. Either can be used to look up the same layer.
             */
            getLayerById(id: number | string): Data.Layer | undefined;
            /** Loads GeoJSON from a URL, and adds the layers to the collection. */
            loadGeoJson(url: string, callback?: (data: Array<Data.Layer>) => void): void;
            /** Removes a layer from the collection. */
            remove(layer: Data.Layer): void;
            /** Exports the layers in the collection to a GeoJSON object. */
            toGeoJson(callback: (object: Object) => void);
    
            /** 
             * This event is fired when a layer is added to the collection.
             * @event addlayer
             * @property {Data.Layer} layer
             */
            addlayer: Event;
    
            /** 
             * This event is fired when a layer is removed to the collection.
             * @event removelayer
             * @property {Data.Layer} layer
             */
            removelayer: Event;
    
            /** 
             * This event is fired for a click on the geometry.
             * @event click
             * @property {Event.MouseEvent} event
             */
            click: Event;
    
            /** 
             * This event is fired when a layer's geometry is set.
             * @event setgeometry
             * @property {Data.Layer} layer
             * @property {Data.Geometry} newGeometry
             * @property {Data.Geometry} oldGeometry
             */
            setgeometry: Event;
    
            /** 
             * This event is fired when a layer's property is set.
             * @event setproperty
             * @property {Data.Layer} layer
             * @property {string} name - the property name
             * @property {any} newValue
             * @property {any} oldValue - The previous value. Will be undefined if the property was added.
             */
            setproperty: Event;
    
            /** 
             * This event is fired when a layer's property is removed.
             * @event removeproperty
             * @property {Data.Layer} layer
             * @property {string} name - the property name
             * @property {any} oldValue
             */
            removeproperty: Event;
        }
        
        export class Layer {
            /**
             * You may pass a schema valid layer config json snippet which will get loaded into this newly created instance.
             * 
             * Note that this operation is not syncronous, and you should listen on `setgeometry` or `setproperty` to know this instance is ready.
             * 
             * If the constructor argument is undefined, an empty instance is created.
             * 
             * @param configSnippet 
             */
            constructor(configSnippet: JSON | undefined);
            /** 
             * Repeatedly invokes the given function, passing a property value and name on each invocation. 
             * The order of iteration through the properties is undefined.
             * */
            forEachProperty(callback: (any, string) => void);
            /** Returns the layer's geometry. */
            getGeometry(): Geometry;
            /** Returns the layer ID. */
            getId(): number | string | undefined;
            /** Returns the value of the requested property, or undefined if the property does not exist. */
            getProperty(name: string): any;
            /** Removes the property with the given name. */
            removeProperty(name: string): void;
            /** Sets the layer's geometry. */
            setGeometry(newGeometry: Geometry | LatLng | LatLngLiteral);
            /** Sets the value of the specified property. If newValue is undefined this is equivalent to calling removeProperty. */
            setProperty(name: string, newValue: any);
            /** Exports the layer to a GeoJSON object. */
            toGeoJson(callback: (obj: Object) => void);
            /** Returns the opacity of the layer on the map from 0 (hidden) to 100 (fully visible) */
            getOpacity(): number;
            /** Sets the opacity value. */
            setOpacity(opacity: number): void;

            /** 
             * This event is triggered when a property is removed.
             * @event removeproperty
             */
            removeproperty

            /** 
             * This event is triggered when a geometry is set.
             * @event setgeometry
             */
            setgeometry

            /** 
             * This event is triggered when a property is set.
             * @event setproperty
             */
            setproperty

            /** 
             * This event is triggered when the opacity changes.
             * @event setproperty
             */
            opacity_changed
        }

        export class Geometry {
            /** Repeatedly invokes the given function, passing a point from the geometry to the function on each invocation. */
            forEachLatLng(callback: (latLng: LatLng) => void)
            /** Returns the type of the geometry object. Possibilities are "Point", "MultiPoint", "LineString", or "MultiLineString". */
            getType(): string;
        }
        /** A Point geometry contains a single LatLng. */
        export class Point extends Geometry {
            /** Constructs a Data.Point from the given LatLng or LatLngLiteral. */
            constructor(latLng: LatLng | LatLngLiteral);
            /** Returns the contained LatLng. */
            get(): LatLng;
            /** Returns the string "Point". */
            getType(): string;

            /** URL of icon to be displayed on the map. */
            icon: string;
        }

        /** A MultiPoint geometry contains a number of LatLngs. */
        export class MultiPoint extends Geometry {
            /** Constructs a MultiPoint from the given LatLngs or LatLngLiterals. */
            constructor(elements: Array<LatLng | LatLngLiteral>);
            /** Returns an array of the contained LatLngs. A new array is returned each time getArray() is called. */
            getArray(): Array<LatLng>
            /** Returns the n-th contained LatLng. */
            getAt(n: number): LatLng;
            /** Returns the number of contained LatLngs. */
            getLength(): number;
            /** Returns the string "MultiPoint". */
            getType(): string;
        }

        /** A LineString geometry contains a number of LatLngs. */
        export class LineString extends MultiPoint {
            /** Returns the string "LineString". */
            getType(): string;
        }

        /** A MultiLineString geometry contains a number of LineStrings. */
        export class MultiLineString extends Geometry {
            /** Constructs a MultiLineString from the given LineStrings or arrays of positions. */
            constructor(elements: Array<LineString | Array<LatLng | LatLngLiteral>>);
            /** Returns an array of the contained LineStrings. A new array is returned each time getArray() is called. */
            getArray(): Array<LineString>;
            /** Returns the n-th contained LineString. */
            getAt(n:number): Array<LineString>;
            /** Returns the number of contained LatLngs. */
            getLength(): number;
            /** Returns the string "MultiLineString". */
            getType(): string;
        }
    }

    /**
     * Uses the `RV.UI` namespace. Contains UI related functionality which is not strictly map related.
     * 
     * @example #### Adding data tags on the side menu buttons for Google tag manager integration <br><br>
     * 
     * ```js
     * $(RV.UI.AnchorPoints.SIDE_MENU.GROUPS).find('button').each(function(node) {
     *     node.data('google-tag', '');
     * });
     * ```
     * 
     * @example #### Opening the left side menu panel<br><br>
     * 
     * ```js
     * RV.UI.Panels.getById('sideMenu').open();
     * ```
     * 
     * @example #### Adding a map control button<br><br>
     * ```js
     * var controlDiv = document.createElement('div');
     * controlDiv.style.backgroundColor = '#fff'; // style as needed
     * $(RV.UI.AnchorPoints.MAP_CONTROLS).appendChild(controlDiv);
     * ```
     */
    export module UI {

        /** Dom nodes for places of interest around the viewer for easier selector location. */
        export const anchorPoints: {
            /** The side menu slide out panel */
            SIDE_MENU: {
                TITLE_IMAGE: Node;
                TITLE: Node;
                GROUPS: MVCArray<Node>;
                FOOTER: Node;
            };
            /** Map navigation controls found at bottom right. */
            MAP_CONTROLS: Node;
            /** Basemap - top right */
            BASEMAP: Node;
            /** Legend action bar containing import, show/hide all, and toggle open/closed */
            LEGEND_BAR: Node;
            /** Main legend section containing legend items */
            LEGEND: Node;
        };

        export const panels: PanelRegistry;

        export const legend: LegendEntry;

        /**
         * @todo Discuss if we should add more panel locations?
         * 
         * <br><br>
         * ```text
         * Panel types:
         *  sideMenu    -   Left siding menu panel
         *  legend      -   Legend panel
         *  import      -   Import wizard
         *  details     -   Layer details
         *  basemap     -   Basemap selector slider menu
         * 
         * There are also top level types:
         *  left    -   contains legend, import, details
         *  center  -   datatables
         * ```
         */
        export class PanelRegistry {
            /** Returns a panel by the given id */
            getById(id: string): Panel | undefined;
            forEach(callback: (panel: Panel) => void): void;

            /** 
             * This event is fired when a panel is fully open and content is finished rendering.
             * @event opened
             * @property {Panel} Panel
             */
            opened: Event;
            
            /** 
             * This event is fired when a panel is fully closed.
             * @event closed
             * @property {Panel} Panel
             */
            closed: Event;

            /** 
             * This event is fired before a panel starts to open. Calling `event.stop()` prevents the panel from opening.
             * @event opening
             * @property {Panel} Panel
             * @property {Event.StoppableEvent} event
             * @property {Node} content
             */
            opening: Event.StoppableEvent;

            /** 
             * This event is fired before a panel starts to close. Calling `event.stop()` prevents the panel from closing.
             * @event closing
             * @property {Panel} Panel
             * @property {Event.StoppableEvent} event
             */
            closing: Event.StoppableEvent;
        }

        /**
         * Note that opening legend when details is open will close details first. Events will be fired for auto closed panels.
         */
        export class Panel {
            /** Returns the panel identifier, can be "featureDetails", "legend", ... */
            getId(): string;
            /** Opens this panel in the viewer */
            open(): void;
            /** Closes this panel in the viewer */
            close(): void;
            isOpen(): boolean;
            /** Returns the dom node of the panel content. */
            getContent(): Node;
            /**
             * You can provide a dom node to set as the panels content.
             */
            setContent(node: Node): void;
            
            /** 
             * This event is fired when the panel is fully open and content is finished rendering.
             * @event opened
             */
            opened: Event;

            /** 
             * This event is fired when the panel is fully closed.
             * @event closed
             */
            closed: Event;

            /** 
             * This event is fired before the panel starts to open. Calling `event.stop()` prevents the panel from opening.
             * @event opening
             * @property {Event.StoppableEvent} event
             * @property {Node} content
             */
            opening: Event.StoppableEvent;

            /** 
             * This event is fired before the panel starts to close. Calling `event.stop()` prevents the panel from closing.
             * @event closing
             * @property {Event.StoppableEvent} event
             */
            closing: Event.StoppableEvent;
        }

        export class LegendEntry {
            /** Displayed as the entry title in the legend.  */
            setTitle(title: string): void;
            /** Adds an entry to this legend block. */
            add(member: Data.DataRegistry | Node | LegendEntry): void;
            /** Returns the dom node containing this legend entry. */
            getNode(): Node;
        }
    }

    /**
     * Uses the `RV.Event` namespace. Handles event registration on MVCObjects and on DOM Nodes.
     * 
     * @example The following two statements are equivalent <br><br>
     * 
     * ```js
     * mapInstance.addListener('bounds_changed', function() {...});
     * RV.Event.addListener(mapInstance, 'bounds_changed', function() {...});
     * ```
     */
    export module Event {
        /** Cross browser event handler registration. This listener is removed by calling removeListener(handle) for the handle that is returned by this function. */
        export function addDomListener(instance: Object, eventName: string, handler: Function, capture?: boolean): MapsEventListener;
        /** Wrapper around addDomListener that removes the listener after the first event. */
        export function addDomListenerOnce(instance: Object, eventName: string, handler: Function, capture?: boolean): MapsEventListener;
        /** Adds the given listener function to the given event name for the given object instance. Returns an identifier for this listener that can be used with removeListener(). */
        export function addListener(instance: Object, eventName: string, handler: Function): MapsEventListener;
        /** Like addListener, but the handler removes itself after handling the first event. */
        export function addListenerOnce(instance:Object, eventName:string, handler:Function): MapsEventListener;
        /** Removes all listeners for all events for the given instance. */
        export function clearInstanceListeners(instance: Object);
        /** Removes all listeners for the given event for the given instance. */
        export function clearListeners(instance: Object, eventName: string);
        /** Removes the given listener, which should have been returned by addListener above. Equivalent to calling listener.remove(). */
        export function removeListener(listener: MapsEventListener);
        /** Triggers the given event. All arguments after eventName are passed as arguments to the listeners. */
        export function trigger(instance: Object, eventName: string, ...var_args: Array<any>);

        export class MouseEvent extends StoppableEvent {
            /** The latitude/longitude that was below the cursor when the event occurred. */
            latLng: LatLng;
        }
    
        export class StoppableEvent {
            /** Prevents this event from propagating further, and in some case preventing viewer action. */
            stop(): void;
        }
    }
}