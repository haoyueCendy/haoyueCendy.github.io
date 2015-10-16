(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
var fs = require('fs');

var Geocoder = require('./src/geocoder'),
    Style = require('./src/style'),
    Markers = require('./src/markers'),
    Draw = require('./src/draw'),
    drop = require('./src/drop'),
    Layers = require('./src/layers'),
    Info = require('./src/info');

var inputIncrement = require('./src/lib/inputincrement'),
    pager = require('./src/lib/pager'),
    color = require('./src/lib/color'),
    zoom = require('./src/lib/zoom'),
    Streets = require('./src/lib/streets');

if (!App) throw new Error('Global App object required');
if (!Views) throw new Error('Global Views object required');

var templates = {
    mapview: _("<a href='#' id='zoom-out' class='fill-darken1 keyline-right inline icon minus'></a><!--\n--><a href='#' id='zoom-in' class='fill-darken1 keyline-right inline icon plus'></a><!--\n--><span class='inline display-view center'>\n  <span class='clip inline'><%-obj.lat%>, <%-obj.lng%></span><span class='hide-small-screen clip inline'>, <%-\n  obj.zoom%></span>\n</span>\n").template()
};

var Editor = Backbone.View.extend({});

Editor.prototype.events = (function() {
    var events = {};
    events['change #save-center']               = 'saveCenter';
    events['click .modes a']                    = 'targetToggle';
    events['click #editor-menu a.signup']       = 'signup';
    events['click .modes a.project-save']       = 'save';
    events['click .readonly']                   = 'inputselect';
    events['keyup #project-data-search']        = 'layersSearch';
    events['click #project-data-browse a']      = 'layersSet';
    events['click #project-layers .close']      = 'layersSet';
    events['click #project-layers a']           = 'layersView';
    events['click .addlayers']                  = 'layersBrowse';
    events['click #marker-menu .js-tabs label'] = 'layersRender';
    events['click .app .js-tabs a']             = 'tabs';
    events['click .app .js-tabs label']         = 'tabs';
    events['click .app .color-tabs a']          = 'tabs';
    events['click .pager a']                    = 'pager';
    events['keyup #project-settings input[type=text]'] = 'set';
    events['keyup #project-settings textarea']      = 'set';
    events['click #private']                    = 'set';
    events['click #legacypublic']               = 'set';
    events['click .js-help-toggle']             = 'helpToggle';
    events['click .draw-controls .button']      = 'drawMode';
    events['click #marker-tray a']              = 'markerEdit';
    events['click #marker-tray .trash']         = 'markerDel';
    events['click #marker-edit .trash']         = 'markerDel';
    events['change #marker-edit input[type=number]'] = 'markerSet';
    events['keyup #marker-edit input']          = 'markerSet';
    events['keyup #marker-edit textarea']       = 'markerSet';
    events['click #marker-edit input[type=radio]'] = 'markerSet';
    events['click #style input[type=radio]']    = 'styleSet';
    events.dragenter                            = 'mapDragEnter';
    events.dragover                             = 'mapDragEnter';
    events.dragleave                            = 'mapDragLeave';
    events['drop #dropzone']                    = 'mapDrop';
    events['change #manual-import']             = 'mapDrop';
    events['click .marker-import-manual']       = 'manualImport';
    events['click .app.modes > a']              = 'changeMode';
    events['change #search-results input']      = 'searchSet';
    events['click #search-results label']       = 'searchSet';
    events['click .module > .close']            = 'reset';
    events['click #zoom-in']                    = 'zoomIn';
    events['click #zoom-out']                   = 'zoomOut';
    events['click #import .tabs a']             = 'propertyPane';
    events['click #import-assign']              = 'importAssign';
    events['click #geocode-submit']             = 'geocodeFields';
    events['click #cancel-tip']                 = 'drawMode';
    events['click .increment']                  = 'inputIncrement';
    events['click .track-kml-download']         = 'downloadKML';
    events['click .track-geojson-download']     = 'downloadGeoJSON';
    events['click .track-ios-docs']             = 'iosDocs';
    events['click .track-js-docs']              = 'jsDocs';
    events['click .track-api-docs']             = 'apiDocs';
    events['change .embed-option']              = 'updateEmbed';
    return events;
})();

Editor.prototype.downloadKML = function(ev) {
    analytics.track('Downloaded Markers as KML');
};

Editor.prototype.downloadGeoJSON = function(ev) {
    analytics.track('Downloaded Markers as GeoJSON');
};

Editor.prototype.iosDocs = function(ev) {
    analytics.track('Viewed iOS docs from editor');
};

Editor.prototype.jsDocs = function(ev) {
    analytics.track('Viewed Javascript docs from editor');
};

Editor.prototype.apiDocs = function(ev) {
    analytics.track('Viewed API docs from editor');
};

Editor.prototype.targetToggle = function(ev) {
    if (window.location.hash === $(ev.currentTarget).attr('href')) {
        window.location.hash = '#';
        return false;
    }
};

Editor.prototype.zoomToggle = zoom.zoomToggle;
Editor.prototype.zoomIn = zoom.zoomIn;
Editor.prototype.zoomOut = zoom.zoomOut;

Editor.prototype.mapDragEnter = drop.mapDragEnter;
Editor.prototype.mapDragLeave = drop.mapDragLeave;
Editor.prototype.mapDrop = drop.mapDrop;

Editor.prototype.displayView = _.throttle(function() {
    var zoom = this.getZoom();
    var lat = parseFloat(this.getCenter().wrap().lat.toFixed(3));
    var lng = parseFloat(this.getCenter().wrap().lng.toFixed(3));
    $('#mapview').html(templates.mapview({ zoom: zoom, lat: lat, lng: lng }));
}, 500);

Editor.prototype.manualImport = function() {
    $('#manual-import').trigger('click');
    return false;
};

Editor.prototype.propertyPane = function(ev) {
    var panels = $('#import').find('.property-panes');
    var pane = $(ev.currentTarget).attr('href').split('#')[1];
    var current = panels.attr('class').match(/active[0-9]+/)[0];
    $(ev.currentTarget).addClass('active').siblings().removeClass('active');
    panels.removeClass(current).addClass(pane);
    return false;
};

Editor.prototype.geocodeFields = function(ev) {
    var values = [];
    var $modal = $(ev.currentTarget).parents('#geocode');

    $modal.find('input:checked')
        .each(function() {
            if ($(this).data('query')) values.push($(this).data('query'));
        });

    if (Views.modal.modals && Views.modal.modals.autogeocode) {
        Views.modal.modals.autogeocode.callback(null, values);
    } else {
        Views.modal.done('autogeocode');
    }

    return false;
};

Editor.prototype.importAssign = function(ev) {
    var values = {};
    var $modal = $(ev.currentTarget).parents('#import');

    $modal.find('input:checked')
        .each(function() {
            if ($(this).data('geojson')) {
                var parts = $(this).data('geojson').split('.');
                values[parts[0]] = parts[1];
            }
        });

    // Test for user entered input for marker-color
    var colorInput = $modal.find('#marker-color').val();
    if (colorInput && (/^#?([0-9a-f]{6})$/i).test(color.formatHex(colorInput))) {
        values['marker-color'] = color.formatHex(colorInput);
    }

    if (Views.modal.modals && Views.modal.modals.propertyassign) {
        Views.modal.modals.propertyassign.callback(null, values);
    } else {
        Views.modal.done('propertyassign');
    }

    return false;
};

Editor.prototype.renderName = function(model, val) {
    $('.project-name').text(val);
};

Editor.prototype.renderID = function(model, val) {
    if (model.id.split('.')[0] === 'api') return;
    $('.project-id').each(function() {
        if ($(this).is('input')) {
            $(this).attr('value',model.id);
        } else {
            $(this).text(model.id);
        }
    });
    if (this.info) {
        this.info.render();
        this.updateEmbed();
    }
};

Editor.prototype.signup = function(ev) {
    Views.modal.show('auth', {close:true}, function(err) {
        if (err && err.code !== 'closed') Views.modal.show('err', err);
    });
    Views.modal.slide('active3');
};

Editor.prototype.set = function(ev) {
    var el = $(ev.currentTarget);
    var attr = {};
    if (el.is('input[type=checkbox]') || el.is('input[type=radio]')) {
        attr[el.attr('name')] = el.is(':checked');
    } else {
        attr[el.attr('name')] = el.val();
    }
    this.model.set(attr);
};

Editor.prototype.saved = function() {
    this.changes = false;
    $('#project').removeClass('changed');
    $('#map-saveshare').removeClass('active1 active2').addClass('active1');
    // potentially update map id
    this.info.render();
    this.updateEmbed();
    bindClipboard();
    analytics.track('Saved a Map');
};

Editor.prototype.changed = function() {
    this.changes = true;
    $('#project').addClass('changed');
    $('#map-saveshare').removeClass('active1 active2').addClass('active2');
};

Editor.prototype.reset = function() {
    window.location.href = '#app';
    this.markers.clear();
    this.map.closePopup();
};

Editor.prototype.tabs = App.tabs;

Editor.prototype.inputselect = function(ev) {
    $(ev.currentTarget).select();
};

Editor.prototype.inputIncrement = inputIncrement;
Editor.prototype.pager = pager;

Editor.prototype.helpToggle = function(ev) {
    if ($(this.el).is('.showhelp')) {
        App.storage('editor.help', true);
        $(this.el).removeClass('showhelp');
    } else {
        App.storage('editor.help', null);
        $(this.el).addClass('showhelp');
    }
    return false;
};

Editor.prototype.styleSet = function(ev) {
    var el = $(ev.currentTarget);
    this.style.set(ev.currentTarget.value);
    this.layers.render();
};

Editor.prototype.markerDel = function(ev) {
    var id = $(ev.currentTarget).is('a') ?
        $(ev.currentTarget).attr('href').split('#').pop() :
        $(ev.currentTarget).parent().attr('id');
    this.markers.del(id);
    analytics.track('Deleted a Marker');
    return false;
};

Editor.prototype.drawMode = function(ev) {
    ev.preventDefault();
    var drawMode = $(ev.currentTarget).attr('href').split('#')[1];
    this.draw.activate(drawMode);
    return false;
};

Editor.prototype.markerEdit = function(ev) {
    var id = $(ev.currentTarget).attr('id');
    this.markers.edit(id);
    analytics.track('Edited a Marker');
    return false;
};

Editor.prototype.markerSet = _(function(ev) {
    if (!this.markers.editing) throw new Error('Nothing to edit');
    var el = $(ev.currentTarget);
    var key = ev.currentTarget.name;
    var val = ev.currentTarget.value;
    var v = val;

    // Validation
    if (key === 'marker-color' && !(/^#?([0-9a-f]{6})$/i).test(color.formatHex(val))) return;
    if (key === 'fill' && !(/^#?([0-9a-f]{6})$/i).test(color.formatHex(val))) return;
    if (key === 'stroke' && !(/^#?([0-9a-f]{6})$/i).test(color.formatHex(val))) return;
    if (key === 'fill-opacity') val = inRange(val, 0, 1, 0.5);
    if (key === 'stroke-opacity') val = inRange(val, 0, 1, 0.5);
    if (key === 'stroke-width') val = inRange(val, 0, 20, 3);

    // hex value keyed in, so clear the swatch checkmark
    if ($(ev.target).hasClass('color-hex')) {
        $('#marker-edit .label-select:checked').prop('checked', false);
    }

    if (key === 'latitude'  || key === 'longitude') {
        var f = parseFloat(val);
        if (!isNaN(f)) {
            this.markers.editing.geometry.coordinates[key === 'longitude' ? 0 : 1] = f;
            var latLng = L.latLng(
                this.markers.editing.geometry.coordinates[1],
                this.markers.editing.geometry.coordinates[0]).wrap();
            this.markers.layerById(this.markers.editing.properties.id).setLatLng(latLng);
            this.changed();
        }
    } else {
        if (v === val) {
            if (key === 'marker-color' ||
                key === 'fill' ||
                key === 'stroke') {
                setHex(key, val);
                val = color.formatHex(val);
            } else {
                $('#' + key).val(val);
            }
        }
        $('#' + this.markers.editing.id + ' .' + key).text(val);
        this.markers.editing.properties[key] = val;
        this.markers.refresh(this.markers.editing.properties.id);
        this.changed();
    }

    this.markers.syncUI();
}).throttle(50);

function setHex(key, val) {
    if (val[0] !== '#') val = '#' + val;
    var hsl = Streets.parseTintString(color.formatHex(val)),
        avg = (hsl.l[0] + hsl.l[1])/2;
    $('#' + key)
        .val(val)
        .css('background-color', val)
        .css('color', (avg >= 0.5) ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,1)');
}

function inRange(v, a, b, def) {
    var f = parseFloat(v);
    if (isNaN(f)) return def;
    return Math.min(Math.max(f, a), b);
}

Editor.prototype.clearSelectMode = function() {
    this.colorSelectMode = false;
    this.colorSelectTarget = null;
};

Editor.prototype.layersSet = function(ev) {
    var el = $(ev.currentTarget).is('a') ? $(ev.currentTarget) : $(ev.currentTarget).parents('a');
    this.layers.toggle(el.data('id'));
    return false;
};

Editor.prototype.layersBrowse = function(ev) {
    this.layers.browse();
    return false;
};

Editor.prototype.layersRender = function(ev) {
    this.layers.render();
};

Editor.prototype.layersSearch = function(ev) {
    this.layers.search(ev.currentTarget.value);
};

Editor.prototype.layersView = function(ev) {
    var el = $(ev.currentTarget).is('a') ? $(ev.currentTarget) : $(ev.currentTarget).parents('a');
    this.layers.setview(el.data('id'));
    return false;
};

Editor.prototype.searchSet = function(ev) {
    if (ev.type == 'click') ev = $('#' + ev.currentTarget.htmlFor);
    this.search.setview(ev);
    return false;
};

Editor.prototype.changeMode = function(ev) {
    this.draw.clear();
    this.markers.clear();
};

// Called from global App keydown.
Editor.prototype.keydown = function(ev) {
    if (!(/#(app|code|data|search|style|project)/).test(window.location.hash)) return;

    var key = ev.which,
        $target = $(ev.target);

    switch (window.location.hash) {
    case '#search':
        switch (key) {
        case 27: // esc
            return this.reset();
        case 38: // up
            ev.preventDefault();
            this.search.select(-1);
            return this.search.setview() && false;
        case 40: // down
            ev.preventDefault();
            this.search.select(1);
            return this.search.setview() && false;
        case 13: // return
            ev.preventDefault();
            return this.search.setview();
        default:
            this.search.focus(ev);
            return this.search.debounced(this.search.input.value);
        }
        break;
    case '#project':
    case '#style':
    case '#data':
        switch (key) {
        case 13: // return
            if (!ev.shiftKey) {
                ev.preventDefault();
                return ev.target.blur();
            }
            break;
        case 27: // esc
            if (_.contains(['input', 'textarea'], ev.target.tagName.toLowerCase())) {
                ev.preventDefault();
                return ev.target.blur();
            } else if (window.location.hash === '#data') {
                return this.draw.mode !== 'browse' ? this.draw.clear() : this.reset();
            } else {
                return this.reset();
            }
            break;
        }
        break;
    // Any state
    default:
        // 0-9a-z => start a new search.
        if (!ev.ctrlKey && !ev.metaKey && !ev.altKey && key >= 48 && key <= 90) {
            window.location.hash = '#search';
            this.search.input.value = '';
            this.search.focus(ev);
        }
        break;
    }

    // ESC: return to app default state
    if (key === 27) {
        return this.reset();
    }

    // TAB: listen for someone tabbing between inputs
    // This prevents half-scroll behavior due to how we use sliding panes
    if (key === 9 && $target.hasClass('js-noTabExit')) {
        ev.preventDefault();
    }
};

// Called from global App keyup.
Editor.prototype.keyup = function(ev) {
    if (!(/#(app|code|data|project|search|style)/).test(window.location.hash)) return;

    var key = ev.which;

    switch (window.location.hash) {
    case '#search':
        switch (key) {
        case 38:
        case 40:
        case 13:
            break;
        default:
            this.search.focus(ev);
            return this.search.debounced(this.search.input.value);
        }
        break;
    }
};

Editor.prototype.saveCenter = function() {
    this.changed();
    return false;
};

Editor.prototype.save = function() {
    var editor = this;
    var attr = {};
    attr.created = +new Date();
    if ($('#save-center').is(':checked')) {
        var center = this.map.getCenter().wrap();
        var zoom = this.map.getZoom();
        attr.center = [center.lng, center.lat, zoom];
    }
    // dont POST the map _rev back to the api. no conflicts,  last write wins.
    this.model.unset('_rev');
    this.model.set(attr);
    $('#app').addClass('loading');
    App.save(this.model, mapSaved);

    function mapSaved(err) {
        if (err) {
            $('#app').removeClass('loading');
            return err.code !== 'closed' && Views.modal.show('err', err);
        }
        editor.markers.save(markersSaved);
    }

    function markersSaved(err) {
        $('#app').removeClass('loading');
        if (err) return err.code !== 'closed' && Views.modal.show('err', err);
        editor.markers.model.set('id', editor.model.id);
        editor.saved();
        if (window.location.hash !== '#project') {
            editor.reset();
            window.location.hash = '#saved';
        }

        if (!App.param('id') && window.history && window.history.replaceState) {
            window.history.replaceState({}, '',
                '/editor/?id=' + editor.model.id + location.hash);
        }
    }

    return false;
};

Editor.prototype.updateEmbed = function() {
    var center = this.map.getCenter().wrap();
    var opts = ['attribution'];
    $('.embed-option').each(function() {
        if (this.checked) opts.push(this.id);
    });

    var url = 'https://a.tiles.mapbox.com/v4/' + this.model.id + '/' + opts.join(',') + '.html?access_token=' + (App.user ? App.user.accessToken : App.accessToken);
    var iframe = "<iframe width='100%' height='500px' frameBorder='0' src='" + url + "'></iframe>";
    $('#map-embed').val(iframe);
    $('#js-clipboard-embed').attr('data-clipboard-text', iframe);
};

Editor.prototype.render = function() {
    $('#project input[name=name]').val(this.model.get('name'));
    $('#project textarea[name=description]').val(this.model.get('description'));
    $('#project input[name=private]').attr('checked', !!this.model.get('private'));

    if (App.user && App.user.accountLevel === 'staff') {
        $('#project input[name=legacypublic]').attr('checked', !!this.model.get('legacypublic'));
    } else {
        $('#project input[name=legacypublic]').parent('.checkbox').hide();
    }

    // If project is new, set center by default
    if(!this.model.get('_rev')) {
        $('#save-center').prop('checked', true);
        this.changed();
    }

    this.dropzone = this.$el.find('#dropzone');
    this.renderName(this.model, this.model.get('name'));
    this.renderID(this.model, this.model.id);
};

Editor.prototype.redraw = function() {
    if (!this.map) return;
    var layers = this.model.attributes.layers;
    if (layers.length > 15) {
        Views.modal.show('err', new Error('Your project exceeds the max layer limit of 15.'));
        layers = layers.slice(0,15);
    }
    var token = '?access_token=' + App.accessToken;
    var updated = '&update=' + (+new Date()).toString(36).substr(0,5);
    this.tilejson.tiles = [App.tileApi + '/v4/' + layers.join(',') + '/{z}/{x}/{y}.png' + token + updated];
    this.map.tileLayer._setTileJSON(this.tilejson);
    this.map.tileLayer.redraw();

    // Model attributes have been updated.
    this.changed();

    // Clear out stale values.
    var view = this;
    delete this.tilejson.grids;
    delete this.tilejson.legend;
    delete this.tilejson.attribution;
    if (this.map.gridLayer) {
        this.map.removeLayer(this.map.gridLayer);
        delete this.map.gridLayer;
    }
    if (this.map.gridControl) {
        this.map.removeControl(this.map.gridControl);
        delete this.map.gridControl;
    }
    if (this.map.legendControl) _(this.map.legendControl._legends).each(function(i,t) {
        view.map.legendControl.removeLegend(t);
    });

    // Fallback if only layer is transparent
    if (!layers.length) layers.push('base.mapbox-streets');

    App.tilejson(layers.join(','), function(err, json) {
        if (err) return;

        // Update min/max/bounds of tileLayer.
        view.tilejson.minzoom = json.minzoom;
        view.tilejson.maxzoom = json.maxzoom;
        view.tilejson.bounds = json.bounds;
        view.map.tileLayer.options.minZoom = json.minzoom;
        view.map.tileLayer.options.maxZoom = json.maxzoom;
        view.map.tileLayer.options.bounds = new L.LatLngBounds(
            new L.LatLng(json.bounds[1], json.bounds[0]),
            new L.LatLng(json.bounds[3], json.bounds[2])
        );
        view.map._updateZoomLevels();
        // Update grids/templates.
        if (json.template) {
            view.tilejson.grids = [App.tileApi + '/v4/' + layers.join(',') + '/{z}/{x}/{y}.grid.json' + token + updated];
            view.map.gridLayer = L.mapbox.gridLayer({
                grids: view.tilejson.grids,
                minzoom: json.minzoom,
                maxzoom: json.maxzoom
            });
            view.map.addLayer(view.map.gridLayer);
            view.map.gridControl = L.mapbox.gridControl(view.map.gridLayer, {template:json.template});
            view.map.addControl(view.map.gridControl);
        }
        // Update legend.
        if (json.legend) {
            view.tilejson.legend = json.legend;
            view.map.legendControl.addLegend(json.legend);
        }
        // Update attribution.
        if (json.attribution) {
            view.tilejson.attribution = json.attribution;
        }
        view.changed();
    });
};

function updateAvatar() {
    if (App.user && App.user.avatar) {
        $('#avatar').removeClass('big mapbox');
        $('#avatar').css('background-image', 'url("' + App.user.avatar + '")');
        $('#avatar').css('background-size', 'cover');
    } else {
        $('#avatar').addClass('big mapbox');
    }
}

function hashChange() {
    if (window.location.hash === '#search') $('#search input').focus();
}

Editor.prototype.initialize = function(options) {
    if (!this.model) throw new Error('Editor requires loaded model instance');
    if (!options.tilejson) throw new Error('Editor requires loaded tilejson object');

    this.tilejson = options.tilejson;

    updateAvatar();

    this.redraw = _(this.redraw).bind(this);
    this.changed = _(this.changed).bind(this);
    this.model.on('change', _(this.changed).throttle(50));
    this.model.on('change:id', _(_.bind(this.renderID, this)).throttle(50));
    this.model.on('change:name', _(this.renderName).throttle(50));
    this.model.on('change:layers', _(this.redraw).throttle(500));

    this.render();

    var editor = this;

    // Omit the data key when instantiating the map.
    // Markers are loaded separately from the API by the marker module.
    var map = L.mapbox.map('map-app', _(this.tilejson).omit('data'), {
        zoomControl: false
    });
    this.map = map;

    var style = Style(App, editor);
    var markers = Markers(App, editor);
    var layers = Layers(App, map, editor);
    var draw = Draw(App, markers, editor);
    var search = Geocoder(editor, map, draw);
    var info = Info(editor, map, markers);
    // var geojsonPanel = GeoJSON(App, map, markers, editor);
    // this.geojsonPanel = geojsonPanel;

    this.style = style;
    this.markers = markers;
    this.search = search;
    this.layers = layers;
    this.draw = draw;
    this.info = info;

    // Display map coordinates
    this.map.on('move', this.displayView);
    this.map.on('moveend', _.bind(this.updateEmbed, this));

    // Global zoom handler
    this.map.on('zoomend', this.zoomToggle);

    // Global onhashchange handler. Calls module onhashchange handlers if set.
    if ('onhashchange' in window) window.onhashchange = function() {
        if (markers && markers.onhashchange) markers.onhashchange();
        if (draw && draw.onhashchange) draw.onhashchange();
        hashChange();
    };

    // Set initial mapview values
    this.displayView.call(this.map);

    // Project Info
    info.render();

    // Global onunload handler.
    if ('onbeforeunload' in window && !App.param('dev')) window.onbeforeunload = function() {
        if (editor.changes) return editor.model.escape('name') + ' has unsaved changes.';
    };

    // Show help if not hidden.
    var hideHelp = App.storage('editor.help');
    if (!hideHelp) this.helpToggle();
    bindClipboard();
    this.updateEmbed();
    return this;
};

function bindClipboard() {
    $('.js-clipboard').each(function() {
        var $clip = $(this);
        if (!$clip.data('zeroclipboard-bound')) {
            var clip = new ZeroClipboard(this);
            $clip.data('zeroclipboard-bound', true);
            clip.on('aftercopy', function() {
                $clip.siblings('input').select();
                $clip.addClass('clipped');
                setTimeout(function() {
                    $clip.removeClass('clipped');
                }, 1000);
            });
        }
    });
}

App.onUserLoad(function load() {
    if (Views.editor) return;

    // Show style page initially for new users
    if (window.location.hash === '#' || window.location.hash === '#app' || !window.location.hash) window.location.hash = '#style';

    var mapid = App.param('id')||'api.tmpmap';
    var newmap = '?newmap=1';
    if (App.param('preset')) newmap += '&preset=' + App.param('preset');
    if (App.param('layers')) newmap += '&layers=' + App.param('layers');
    if (App.param('id')) App.storage('map.id', App.param('id'));

    Views.editor = true;
    (function getdata(opts) {
        if (!opts.model) {
            App.fetch('/api/Map/' + mapid + newmap, function(err, model) {
                if (!err && model.get('_type') !== 'composite') {
                    err = new Error('Cannot edit project ' + model.escape('id'));
                }
                if (err) return Views.modal.show('err', err);
                opts.model = model;
                getdata(opts);
            });
        } else if (!opts.tilejson) {
            var loaded = function(tilejson) {
                opts.tilejson = tilejson;
                // tilestream-pro#3591
                if (tilejson === undefined) tilejson.minzoom = 0;
                if (tilejson === undefined) tilejson.maxzoom = 19;
                tilejson.center = opts.model.get('center') || tilejson.center;
                getdata(opts);
            };
            // If transparent style is the only layer, fallback to transparent
            // mapbox-streets.
            var layers = opts.model.get('layers').length ? opts.model.get('layers').slice(0,15).join(',') : 'base.mapbox-streets';
            App.tilejson(layers, function(err, tilejson) {
                if (err && err.status !== 404) {
                    Views.modal.show('err', err);
                // If a project has only 404'ing tilejson layers then *none*
                // of the layers exist. Fallback to a fully transparent
                // mapbox-streets rather than failing hard.
                } else if (err) {
                    App.tilejson('base.mapbox-streets', function(err, tilejson) {
                        if (err) return Views.modal.show('err', err);
                        loaded(tilejson);
                    });
                // Tilejson for layers loaded successfully.
                } else {
                    loaded(tilejson);
                }
            });
        } else if (!App.param('layers') && !opts.model.get('_rev') && !opts.local) {
            App.local(function(err, local) {
                opts.local = local || opts.model.get('center');
                opts.model.set({center:opts.local});
                getdata(opts);
            });
        } else {
            opts.el = $('body');
            Views.editor = new Editor(opts);
        }
    })({});
});

})();

},{"./src/draw":24,"./src/drop":25,"./src/geocoder":26,"./src/info":27,"./src/layers":28,"./src/lib/color":29,"./src/lib/inputincrement":34,"./src/lib/pager":36,"./src/lib/streets":38,"./src/lib/zoom":40,"./src/markers":41,"./src/style":42,"fs":2}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
module.exports=require(2)
},{}],4:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require("FWaASH"))
},{"FWaASH":5}],5:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],6:[function(require,module,exports){
var dsv = require('dsv'),
    sexagesimal = require('sexagesimal');

function isLat(f) { return !!f.match(/(Lat)(itude)?/gi); }
function isLon(f) { return !!f.match(/(L)(on|ng)(gitude)?/i); }

function keyCount(o) {
    return (typeof o == 'object') ? Object.keys(o).length : 0;
}

function autoDelimiter(x) {
    var delimiters = [',', ';', '\t', '|'];
    var results = [];

    delimiters.forEach(function(delimiter) {
        var res = dsv(delimiter).parse(x);
        if (res.length >= 1) {
            var count = keyCount(res[0]);
            for (var i = 0; i < res.length; i++) {
                if (keyCount(res[i]) !== count) return;
            }
            results.push({
                delimiter: delimiter,
                arity: Object.keys(res[0]).length,
            });
        }
    });

    if (results.length) {
        return results.sort(function(a, b) {
            return b.arity - a.arity;
        })[0].delimiter;
    } else {
        return null;
    }
}

function auto(x) {
    var delimiter = autoDelimiter(x);
    if (!delimiter) return null;
    return dsv(delimiter).parse(x);
}

function csv2geojson(x, options, callback) {

    if (!callback) {
        callback = options;
        options = {};
    }

    options.delimiter = options.delimiter || ',';

    var latfield = options.latfield || '',
        lonfield = options.lonfield || '';

    var features = [],
        featurecollection = { type: 'FeatureCollection', features: features };

    if (options.delimiter === 'auto' && typeof x == 'string') {
        options.delimiter = autoDelimiter(x);
        if (!options.delimiter) return callback({
            type: 'Error',
            message: 'Could not autodetect delimiter'
        });
    }

    var parsed = (typeof x == 'string') ? dsv(options.delimiter).parse(x) : x;

    if (!parsed.length) return callback(null, featurecollection);

    if (!latfield || !lonfield) {
        for (var f in parsed[0]) {
            if (!latfield && isLat(f)) latfield = f;
            if (!lonfield && isLon(f)) lonfield = f;
        }
        if (!latfield || !lonfield) {
            var fields = [];
            for (var k in parsed[0]) fields.push(k);
            return callback({
                type: 'Error',
                message: 'Latitude and longitude fields not present',
                data: parsed,
                fields: fields
            });
        }
    }

    var errors = [];

    for (var i = 0; i < parsed.length; i++) {
        if (parsed[i][lonfield] !== undefined &&
            parsed[i][lonfield] !== undefined) {

            var lonk = parsed[i][lonfield],
                latk = parsed[i][latfield],
                lonf, latf,
                a;

            a = sexagesimal(lonk, 'EW');
            if (a) lonk = a;
            a = sexagesimal(latk, 'NS');
            if (a) latk = a;

            lonf = parseFloat(lonk);
            latf = parseFloat(latk);

            if (isNaN(lonf) ||
                isNaN(latf)) {
                errors.push({
                    message: 'A row contained an invalid value for latitude or longitude',
                    row: parsed[i]
                });
            } else {
                if (!options.includeLatLon) {
                    delete parsed[i][lonfield];
                    delete parsed[i][latfield];
                }

                features.push({
                    type: 'Feature',
                    properties: parsed[i],
                    geometry: {
                        type: 'Point',
                        coordinates: [
                            parseFloat(lonf),
                            parseFloat(latf)
                        ]
                    }
                });
            }
        }
    }

    callback(errors.length ? errors: null, featurecollection);
}

function toLine(gj) {
    var features = gj.features;
    var line = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: []
        }
    };
    for (var i = 0; i < features.length; i++) {
        line.geometry.coordinates.push(features[i].geometry.coordinates);
    }
    line.properties = features[0].properties;
    return {
        type: 'FeatureCollection',
        features: [line]
    };
}

function toPolygon(gj) {
    var features = gj.features;
    var poly = {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [[]]
        }
    };
    for (var i = 0; i < features.length; i++) {
        poly.geometry.coordinates[0].push(features[i].geometry.coordinates);
    }
    poly.properties = features[0].properties;
    return {
        type: 'FeatureCollection',
        features: [poly]
    };
}

module.exports = {
    isLon: isLon,
    isLat: isLat,
    csv: dsv.csv.parse,
    tsv: dsv.tsv.parse,
    dsv: dsv,
    auto: auto,
    csv2geojson: csv2geojson,
    toLine: toLine,
    toPolygon: toPolygon
};

},{"dsv":7,"sexagesimal":8}],7:[function(require,module,exports){
var fs = require("fs");

module.exports = new Function("dsv.version = \"0.0.3\";\n\ndsv.tsv = dsv(\"\\t\");\ndsv.csv = dsv(\",\");\n\nfunction dsv(delimiter) {\n  var dsv = {},\n      reFormat = new RegExp(\"[\\\"\" + delimiter + \"\\n]\"),\n      delimiterCode = delimiter.charCodeAt(0);\n\n  dsv.parse = function(text, f) {\n    var o;\n    return dsv.parseRows(text, function(row, i) {\n      if (o) return o(row, i - 1);\n      var a = new Function(\"d\", \"return {\" + row.map(function(name, i) {\n        return JSON.stringify(name) + \": d[\" + i + \"]\";\n      }).join(\",\") + \"}\");\n      o = f ? function(row, i) { return f(a(row), i); } : a;\n    });\n  };\n\n  dsv.parseRows = function(text, f) {\n    var EOL = {}, // sentinel value for end-of-line\n        EOF = {}, // sentinel value for end-of-file\n        rows = [], // output rows\n        N = text.length,\n        I = 0, // current character index\n        n = 0, // the current line number\n        t, // the current token\n        eol; // is the current token followed by EOL?\n\n    function token() {\n      if (I >= N) return EOF; // special case: end of file\n      if (eol) return eol = false, EOL; // special case: end of line\n\n      // special case: quotes\n      var j = I;\n      if (text.charCodeAt(j) === 34) {\n        var i = j;\n        while (i++ < N) {\n          if (text.charCodeAt(i) === 34) {\n            if (text.charCodeAt(i + 1) !== 34) break;\n            ++i;\n          }\n        }\n        I = i + 2;\n        var c = text.charCodeAt(i + 1);\n        if (c === 13) {\n          eol = true;\n          if (text.charCodeAt(i + 2) === 10) ++I;\n        } else if (c === 10) {\n          eol = true;\n        }\n        return text.substring(j + 1, i).replace(/\"\"/g, \"\\\"\");\n      }\n\n      // common case: find next delimiter or newline\n      while (I < N) {\n        var c = text.charCodeAt(I++), k = 1;\n        if (c === 10) eol = true; // \\n\n        else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \\r|\\r\\n\n        else if (c !== delimiterCode) continue;\n        return text.substring(j, I - k);\n      }\n\n      // special case: last token before EOF\n      return text.substring(j);\n    }\n\n    while ((t = token()) !== EOF) {\n      var a = [];\n      while (t !== EOL && t !== EOF) {\n        a.push(t);\n        t = token();\n      }\n      if (f && !(a = f(a, n++))) continue;\n      rows.push(a);\n    }\n\n    return rows;\n  };\n\n  dsv.format = function(rows) {\n    if (Array.isArray(rows[0])) return dsv.formatRows(rows); // deprecated; use formatRows\n    var fieldSet = {}, fields = [];\n\n    // Compute unique fields in order of discovery.\n    rows.forEach(function(row) {\n      for (var field in row) {\n        if (!(field in fieldSet)) {\n          fields.push(fieldSet[field] = field);\n        }\n      }\n    });\n\n    return [fields.map(formatValue).join(delimiter)].concat(rows.map(function(row) {\n      return fields.map(function(field) {\n        return formatValue(row[field]);\n      }).join(delimiter);\n    })).join(\"\\n\");\n  };\n\n  dsv.formatRows = function(rows) {\n    return rows.map(formatRow).join(\"\\n\");\n  };\n\n  function formatRow(row) {\n    return row.map(formatValue).join(delimiter);\n  }\n\n  function formatValue(text) {\n    return reFormat.test(text) ? \"\\\"\" + text.replace(/\\\"/g, \"\\\"\\\"\") + \"\\\"\" : text;\n  }\n\n  return dsv;\n}\n" + ";return dsv")();

},{"fs":2}],8:[function(require,module,exports){
module.exports = function(x, dims) {
    if (!dims) dims = 'NSEW';
    if (typeof x !== 'string') return null;
    var r = /^([0-9.]+)°? *(?:([0-9.]+)['’′‘] *)?(?:([0-9.]+)(?:''|"|”|″) *)?([NSEW])?/,
        m = x.match(r);
    if (!m) return null;
    else if (m[4] && dims.indexOf(m[4]) === -1) return null;
    else return (((m[1]) ? parseFloat(m[1]) : 0) +
        ((m[2] ? parseFloat(m[2]) / 60 : 0)) +
        ((m[3] ? parseFloat(m[3]) / 3600 : 0))) *
        ((m[4] && m[4] === 'S' || m[4] === 'W') ? -1 : 1);
};

},{}],9:[function(require,module,exports){
var xhr = require('xhr');
var queue = require('queue-async');

module.exports = geocodemany;

function geocodemany(accessToken, throttle) {
  throttle = (throttle === undefined) ? 200 : throttle;
  return function(list, transform, progress, callback) {

    var q = queue(1),
      todo = list.length,
      out = [],
      left = [],
      statuses = range(todo).map(function() {
        return undefined;
      }),
      done = 0;

    function range(n) {
      var arr = [];
      for (var i = 0; i < n; i++) arr.push(i);
      return arr;
    }

    function error(err, callback) {
      statuses[done] = false;
      progress({
        todo: todo,
        done: ++done,
        status: 'error',
        statuses: statuses
      });
      setTimeout(function() {
        callback(null, err);
      }, throttle);
    }

    // forgive me
    function copy(o) {
      return JSON.parse(JSON.stringify(o));
    }

    function run(obj, callback) {
      var str = transform(obj);
      var output = copy(obj);

      var options = {
        uri: 'https://api.tiles.mapbox.com/v4/geocode/mapbox.places/' + encodeURIComponent(str) + '.json?access_token=' + accessToken,
        method: 'GET',
        withCredentials: false
      };

      var req = xhr(options, function(err, res) {
        if (err) {
          error({
            error: new Error('Location not found'),
            __iserror__: true,
            data: output
          }, callback);
        }

        var data = JSON.parse(res.body);
        if (data && data.features && data.features.length) {

          var ll = data.features[0];
          output.longitude = ll.center[0];
          output.latitude = ll.center[1];
          statuses[done] = true;
          progress({
            todo: todo,
            data: data ? data : {},
            done: ++done,
            status: 'success',
            statuses: statuses
          });
          setTimeout(function() {
            callback(null, output);
          }, throttle);

        } else {
          error({
            error: new Error('Location not found'),
            __iserror__: true,
            data: output
          }, callback);
        }
      });
    }

    function enqueue(obj) {
      q.defer(run, obj);
    }

    list.forEach(enqueue);

    q.awaitAll(function(err, res) {
      callback(res
        .filter(function(r) {
          return r.__iserror__;
        })
        .map(function(r) {
          delete r.__iserror__;
          return r;
        }),
        res.filter(function(r) {
          return !r.__iserror__;
        }));
    });
  };
}

},{"queue-async":21,"xhr":10}],10:[function(require,module,exports){
"use strict";
var window = require("global/window")
var once = require("once")
var parseHeaders = require("parse-headers")


var XHR = window.XMLHttpRequest || noop
var XDR = "withCredentials" in (new XHR()) ? XHR : window.XDomainRequest

module.exports = createXHR

function createXHR(options, callback) {
    function readystatechange() {
        if (xhr.readyState === 4) {
            loadFunc()
        }
    }

    function getBody() {
        // Chrome with requestType=blob throws errors arround when even testing access to responseText
        var body = undefined

        if (xhr.response) {
            body = xhr.response
        } else if (xhr.responseType === "text" || !xhr.responseType) {
            body = xhr.responseText || xhr.responseXML
        }

        if (isJson) {
            try {
                body = JSON.parse(body)
            } catch (e) {}
        }

        return body
    }
    
    var failureResponse = {
                body: undefined,
                headers: {},
                statusCode: 0,
                method: method,
                url: uri,
                rawRequest: xhr
            }
    
    function errorFunc(evt) {
        clearTimeout(timeoutTimer)
        if(!(evt instanceof Error)){
            evt = new Error("" + (evt || "unknown") )
        }
        evt.statusCode = 0
        callback(evt, failureResponse)
    }

    // will load the data & process the response in a special response object
    function loadFunc() {
        clearTimeout(timeoutTimer)
        
        var status = (xhr.status === 1223 ? 204 : xhr.status)
        var response = failureResponse
        var err = null
        
        if (status !== 0){
            response = {
                body: getBody(),
                statusCode: status,
                method: method,
                headers: {},
                url: uri,
                rawRequest: xhr
            }
            if(xhr.getAllResponseHeaders){ //remember xhr can in fact be XDR for CORS in IE
                response.headers = parseHeaders(xhr.getAllResponseHeaders())
            }
        } else {
            err = new Error("Internal XMLHttpRequest Error")
        }
        callback(err, response, response.body)
        
    }
    
    if (typeof options === "string") {
        options = { uri: options }
    }

    options = options || {}
    if(typeof callback === "undefined"){
        throw new Error("callback argument missing")
    }
    callback = once(callback)

    var xhr = options.xhr || null

    if (!xhr) {
        if (options.cors || options.useXDR) {
            xhr = new XDR()
        }else{
            xhr = new XHR()
        }
    }

    var key
    var uri = xhr.url = options.uri || options.url
    var method = xhr.method = options.method || "GET"
    var body = options.body || options.data
    var headers = xhr.headers = options.headers || {}
    var sync = !!options.sync
    var isJson = false
    var timeoutTimer

    if ("json" in options) {
        isJson = true
        headers["Accept"] || (headers["Accept"] = "application/json") //Don't override existing accept header declared by user
        if (method !== "GET" && method !== "HEAD") {
            headers["Content-Type"] = "application/json"
            body = JSON.stringify(options.json)
        }
    }

    xhr.onreadystatechange = readystatechange
    xhr.onload = loadFunc
    xhr.onerror = errorFunc
    // IE9 must have onprogress be set to a unique function.
    xhr.onprogress = function () {
        // IE must die
    }
    xhr.ontimeout = errorFunc
    xhr.open(method, uri, !sync, options.username, options.password)
    //has to be after open
    if(!sync) {
        xhr.withCredentials = !!options.withCredentials
    }
    // Cannot set timeout with sync request
    // not setting timeout on the xhr object, because of old webkits etc. not handling that correctly
    // both npm's request and jquery 1.x use this kind of timeout, so this is being consistent
    if (!sync && options.timeout > 0 ) {
        timeoutTimer = setTimeout(function(){
            xhr.abort("timeout");
        }, options.timeout+2 );
    }

    if (xhr.setRequestHeader) {
        for(key in headers){
            if(headers.hasOwnProperty(key)){
                xhr.setRequestHeader(key, headers[key])
            }
        }
    } else if (options.headers) {
        throw new Error("Headers cannot be set on an XDomainRequest object")
    }

    if ("responseType" in options) {
        xhr.responseType = options.responseType
    }
    
    if ("beforeSend" in options && 
        typeof options.beforeSend === "function"
    ) {
        options.beforeSend(xhr)
    }

    xhr.send(body)

    return xhr


}


function noop() {}

},{"global/window":11,"once":12,"parse-headers":16}],11:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],12:[function(require,module,exports){
module.exports = once

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })
})

function once (fn) {
  var called = false
  return function () {
    if (called) return
    called = true
    return fn.apply(this, arguments)
  }
}

},{}],13:[function(require,module,exports){
var isFunction = require('is-function')

module.exports = forEach

var toString = Object.prototype.toString
var hasOwnProperty = Object.prototype.hasOwnProperty

function forEach(list, iterator, context) {
    if (!isFunction(iterator)) {
        throw new TypeError('iterator must be a function')
    }

    if (arguments.length < 3) {
        context = this
    }
    
    if (toString.call(list) === '[object Array]')
        forEachArray(list, iterator, context)
    else if (typeof list === 'string')
        forEachString(list, iterator, context)
    else
        forEachObject(list, iterator, context)
}

function forEachArray(array, iterator, context) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (hasOwnProperty.call(array, i)) {
            iterator.call(context, array[i], i, array)
        }
    }
}

function forEachString(string, iterator, context) {
    for (var i = 0, len = string.length; i < len; i++) {
        // no such thing as a sparse string.
        iterator.call(context, string.charAt(i), i, string)
    }
}

function forEachObject(object, iterator, context) {
    for (var k in object) {
        if (hasOwnProperty.call(object, k)) {
            iterator.call(context, object[k], k, object)
        }
    }
}

},{"is-function":14}],14:[function(require,module,exports){
module.exports = isFunction

var toString = Object.prototype.toString

function isFunction (fn) {
  var string = toString.call(fn)
  return string === '[object Function]' ||
    (typeof fn === 'function' && string !== '[object RegExp]') ||
    (typeof window !== 'undefined' &&
     // IE8 and below
     (fn === window.setTimeout ||
      fn === window.alert ||
      fn === window.confirm ||
      fn === window.prompt))
};

},{}],15:[function(require,module,exports){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
};

},{}],16:[function(require,module,exports){
var trim = require('trim')
  , forEach = require('for-each')
  , isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    }

module.exports = function (headers) {
  if (!headers)
    return {}

  var result = {}

  forEach(
      trim(headers).split('\n')
    , function (row) {
        var index = row.indexOf(':')
          , key = trim(row.slice(0, index)).toLowerCase()
          , value = trim(row.slice(index + 1))

        if (typeof(result[key]) === 'undefined') {
          result[key] = value
        } else if (isArray(result[key])) {
          result[key].push(value)
        } else {
          result[key] = [ result[key], value ]
        }
      }
  )

  return result
}
},{"for-each":13,"trim":15}],17:[function(require,module,exports){
module.exports = flatten;

function flatten(gj, up) {
    switch ((gj && gj.type) || null) {
        case 'FeatureCollection':
            gj.features = gj.features.reduce(function(mem, feature) {
                return mem.concat(flatten(feature));
            }, []);
            return gj;
        case 'Feature':
            return flatten(gj.geometry).map(function(geom) {
                return {
                    type: 'Feature',
                    properties: JSON.parse(JSON.stringify(gj.properties)),
                    geometry: geom
                };
            });
        case 'MultiPoint':
            return gj.coordinates.map(function(_) {
                return { type: 'Point', coordinates: _ };
            });
        case 'MultiPolygon':
            return gj.coordinates.map(function(_) {
                return { type: 'Polygon', coordinates: _ };
            });
        case 'MultiLineString':
            return gj.coordinates.map(function(_) {
                return { type: 'LineString', coordinates: _ };
            });
        case 'GeometryCollection':
            return gj.geometries;
        case 'Point':
        case 'Polygon':
        case 'LineString':
            return [gj];
        default:
            return gj;
    }
}

},{}],18:[function(require,module,exports){
module.exports = normalize;

var types = {
    Point: 'geometry',
    MultiPoint: 'geometry',
    LineString: 'geometry',
    MultiLineString: 'geometry',
    Polygon: 'geometry',
    MultiPolygon: 'geometry',
    GeometryCollection: 'geometry',
    Feature: 'feature',
    FeatureCollection: 'featurecollection'
};

/**
 * Normalize a GeoJSON feature into a FeatureCollection.
 *
 * @param {object} gj geojson data
 * @returns {object} normalized geojson data
 */
function normalize(gj) {
    if (!gj || !gj.type) return null;
    var type = types[gj.type];
    if (!type) return null;

    if (type === 'geometry') {
        return {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                properties: {},
                geometry: gj
            }]
        };
    } else if (type === 'feature') {
        return {
            type: 'FeatureCollection',
            features: [gj]
        };
    } else if (type === 'featurecollection') {
        return gj;
    }
}

},{}],19:[function(require,module,exports){
var jsonlint = require('jsonlint-lines');

function hint(str) {

    var errors = [], gj;

    function root(_) {
        if (!_.type) {
            errors.push({
                message: 'The type property is required and was not found',
                line: _.__line__
            });
        } else if (!types[_.type]) {
            errors.push({
                message: 'The type ' + _.type + ' is unknown',
                line: _.__line__
            });
        } else if (_) {
            types[_.type](_);
        }
    }

    function everyIs(_, type) {
        // make a single exception because typeof null === 'object'
        return _.every(function(x) { return (x !== null) && (typeof x === type); });
    }

    function requiredProperty(_, name, type) {
        if (typeof _[name] == 'undefined') {
            return errors.push({
                message: '"' + name + '" property required',
                line: _.__line__
            });
        } else if (type === 'array') {
            if (!Array.isArray(_[name])) {
                return errors.push({
                    message: '"' + name +
                        '" property should be an array, but is an ' +
                        (typeof _[name]) + ' instead',
                    line: _.__line__
                });
            }
        } else if (type && typeof _[name] !== type) {
            return errors.push({
                message: '"' + name +
                    '" property should be ' + (type) +
                    ', but is an ' + (typeof _[name]) + ' instead',
                line: _.__line__
            });
        }
    }

    // http://geojson.org/geojson-spec.html#feature-collection-objects
    function FeatureCollection(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'features', 'array')) {
            if (!everyIs(_.features, 'object')) {
                return errors.push({
                    message: 'Every feature must be an object',
                    line: _.__line__
                });
            }
            _.features.forEach(Feature);
        }
    }

    // http://geojson.org/geojson-spec.html#positions
    function position(_, line) {
        if (!Array.isArray(_)) {
            return errors.push({
                message: 'position should be an array, is a ' + (typeof _) +
                    ' instead',
                line: _.__line__ || line
            });
        } else {
            if (_.length < 2) {
                return errors.push({
                    message: 'position must have 2 or more elements',
                    line: _.__line__ || line
                });
            }
            if (!everyIs(_, 'number')) {
                return errors.push({
                    message: 'each element in a position must be a number',
                    line: _.__line__ || line
                });
            }
        }
    }

    function positionArray(coords, type, depth, line) {
        if (line === undefined && coords.__line__ !== undefined) {
            line = coords.__line__;
        }
        if (depth === 0) {
            return position(coords, line);
        } else {
            if (depth === 1 && type) {
                if (type === 'LinearRing') {
                    if (coords.length < 4) {
                        errors.push({
                            message: 'a LinearRing of coordinates needs to have four or more positions',
                            line: line
                        });
                    }
                    if (coords.length &&
                        (coords[coords.length - 1].length !== coords[0].length ||
                        !coords[coords.length - 1].every(function(position, index) {
                        return coords[0][index] === position;
                    }))) {
                        errors.push({
                            message: 'the first and last positions in a LinearRing of coordinates must be the same',
                            line: line
                        });
                    }
                } else if (type === 'Line' && coords.length < 2) {
                    errors.push({
                        message: 'a line needs to have two or more coordinates to be valid',
                        line: line
                    });
                }
            }
            if (!Array.isArray(coords)) {
                return errors.push({
                    message: 'coordinates must be list of positions',
                    line: line
                });
            }
            coords.forEach(function(c) {
                positionArray(c, type, depth - 1, c.__line__ || line);
            });
        }
    }

    function crs(_) {
        if (!_.crs) return;
        if (typeof _.crs === 'object') {
            var strErr = requiredProperty(_.crs, 'type', 'string'),
                propErr = requiredProperty(_.crs, 'properties', 'object');
            if (!strErr && !propErr) {
                // http://geojson.org/geojson-spec.html#named-crs
                if (_.crs.type == 'name') {
                    requiredProperty(_.crs.properties, 'name', 'string');
                } else if (_.crs.type == 'link') {
                    requiredProperty(_.crs.properties, 'href', 'string');
                }
            }
        } else {
            errors.push({
                message: 'the value of the crs property must be an object, not a ' + (typeof _.crs),
                line: _.__line__
            });
        }
    }

    function bbox(_) {
        if (!_.bbox) return;
        if (Array.isArray(_.bbox)) {
            if (!everyIs(_.bbox, 'number')) {
                return errors.push({
                    message: 'each element in a bbox property must be a number',
                    line: _.bbox.__line__
                });
            }
        } else {
            errors.push({
                message: 'bbox property must be an array of numbers, but is a ' + (typeof _.bbox),
                line: _.__line__
            });
        }
    }

    // http://geojson.org/geojson-spec.html#point
    function Point(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            position(_.coordinates);
        }
    }

    // http://geojson.org/geojson-spec.html#polygon
    function Polygon(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 'LinearRing', 2);
        }
    }

    // http://geojson.org/geojson-spec.html#multipolygon
    function MultiPolygon(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 'LinearRing', 3);
        }
    }

    // http://geojson.org/geojson-spec.html#linestring
    function LineString(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 'Line', 1);
        }
    }

    // http://geojson.org/geojson-spec.html#multilinestring
    function MultiLineString(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 'Line', 2);
        }
    }

    // http://geojson.org/geojson-spec.html#multipoint
    function MultiPoint(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, '', 1);
        }
    }

    function GeometryCollection(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'geometries', 'array')) {
            _.geometries.forEach(function(geometry) {
                if (geometry) root(geometry);
            });
        }
    }

    function Feature(_) {
        crs(_);
        bbox(_);
        if (_.type !== 'Feature') {
            errors.push({
                message: 'GeoJSON features must have a type=feature property',
                line: _.__line__
            });
        }
        requiredProperty(_, 'properties', 'object');
        if (!requiredProperty(_, 'geometry', 'object')) {
            // http://geojson.org/geojson-spec.html#feature-objects
            // tolerate null geometry
            if (_.geometry) root(_.geometry);
        }
    }

    var types = {
        Point: Point,
        Feature: Feature,
        MultiPoint: MultiPoint,
        LineString: LineString,
        MultiLineString: MultiLineString,
        FeatureCollection: FeatureCollection,
        GeometryCollection: GeometryCollection,
        Polygon: Polygon,
        MultiPolygon: MultiPolygon
    };

    if (typeof str !== 'string') {
        return [{
            message: 'Expected string input',
            line: 0
        }];
    }

    try {
        gj = jsonlint.parse(str);
    } catch(e) {
        var match = e.message.match(/line (\d+)/),
            lineNumber = 0;
        if (match) lineNumber = parseInt(match[1], 10);
        return [{
            line: lineNumber - 1,
            message: e.message,
            error: e
        }];
    }

    if (typeof gj !== 'object' ||
        gj === null ||
        gj === undefined) {
        errors.push({
            message: 'The root of a GeoJSON object must be an object.',
            line: 0
        });
        return errors;
    }

    root(gj);

    return errors;
}

module.exports.hint = hint;

},{"jsonlint-lines":20}],20:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.6 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var jsonlint = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"JSONString":3,"STRING":4,"JSONNumber":5,"NUMBER":6,"JSONNullLiteral":7,"NULL":8,"JSONBooleanLiteral":9,"TRUE":10,"FALSE":11,"JSONText":12,"JSONValue":13,"EOF":14,"JSONObject":15,"JSONArray":16,"{":17,"}":18,"JSONMemberList":19,"JSONMember":20,":":21,",":22,"[":23,"]":24,"JSONElementList":25,"$accept":0,"$end":1},
terminals_: {2:"error",4:"STRING",6:"NUMBER",8:"NULL",10:"TRUE",11:"FALSE",14:"EOF",17:"{",18:"}",21:":",22:",",23:"[",24:"]"},
productions_: [0,[3,1],[5,1],[7,1],[9,1],[9,1],[12,2],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[15,2],[15,3],[20,3],[19,1],[19,3],[16,2],[16,3],[25,1],[25,3]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1: // replace escaped characters with actual character
          this.$ = yytext.replace(/\\(\\|")/g, "$"+"1")
                     .replace(/\\n/g,'\n')
                     .replace(/\\r/g,'\r')
                     .replace(/\\t/g,'\t')
                     .replace(/\\v/g,'\v')
                     .replace(/\\f/g,'\f')
                     .replace(/\\b/g,'\b');
        
break;
case 2:this.$ = Number(yytext);
break;
case 3:this.$ = null;
break;
case 4:this.$ = true;
break;
case 5:this.$ = false;
break;
case 6:return this.$ = $$[$0-1];
break;
case 13:this.$ = {}; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 14:this.$ = $$[$0-1]; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 15:this.$ = [$$[$0-2], $$[$0]];
break;
case 16:this.$ = {}; this.$[$$[$0][0]] = $$[$0][1];
break;
case 17:this.$ = $$[$0-2]; $$[$0-2][$$[$0][0]] = $$[$0][1];
break;
case 18:this.$ = []; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 19:this.$ = $$[$0-1]; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 20:this.$ = [$$[$0]];
break;
case 21:this.$ = $$[$0-2]; $$[$0-2].push($$[$0]);
break;
}
},
table: [{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],12:1,13:2,15:7,16:8,17:[1,14],23:[1,15]},{1:[3]},{14:[1,16]},{14:[2,7],18:[2,7],22:[2,7],24:[2,7]},{14:[2,8],18:[2,8],22:[2,8],24:[2,8]},{14:[2,9],18:[2,9],22:[2,9],24:[2,9]},{14:[2,10],18:[2,10],22:[2,10],24:[2,10]},{14:[2,11],18:[2,11],22:[2,11],24:[2,11]},{14:[2,12],18:[2,12],22:[2,12],24:[2,12]},{14:[2,3],18:[2,3],22:[2,3],24:[2,3]},{14:[2,4],18:[2,4],22:[2,4],24:[2,4]},{14:[2,5],18:[2,5],22:[2,5],24:[2,5]},{14:[2,1],18:[2,1],21:[2,1],22:[2,1],24:[2,1]},{14:[2,2],18:[2,2],22:[2,2],24:[2,2]},{3:20,4:[1,12],18:[1,17],19:18,20:19},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:23,15:7,16:8,17:[1,14],23:[1,15],24:[1,21],25:22},{1:[2,6]},{14:[2,13],18:[2,13],22:[2,13],24:[2,13]},{18:[1,24],22:[1,25]},{18:[2,16],22:[2,16]},{21:[1,26]},{14:[2,18],18:[2,18],22:[2,18],24:[2,18]},{22:[1,28],24:[1,27]},{22:[2,20],24:[2,20]},{14:[2,14],18:[2,14],22:[2,14],24:[2,14]},{3:20,4:[1,12],20:29},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:30,15:7,16:8,17:[1,14],23:[1,15]},{14:[2,19],18:[2,19],22:[2,19],24:[2,19]},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:31,15:7,16:8,17:[1,14],23:[1,15]},{18:[2,17],22:[2,17]},{18:[2,15],22:[2,15]},{22:[2,21],24:[2,21]}],
defaultActions: {16:[2,6]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.2.1 */
var lexer = (function(){
var lexer = {

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input) {
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 6
break;
case 2:yy_.yytext = yy_.yytext.substr(1,yy_.yyleng-2); return 4
break;
case 3:return 17
break;
case 4:return 18
break;
case 5:return 23
break;
case 6:return 24
break;
case 7:return 22
break;
case 8:return 21
break;
case 9:return 10
break;
case 10:return 11
break;
case 11:return 8
break;
case 12:return 14
break;
case 13:return 'INVALID'
break;
}
},
rules: [/^(?:\s+)/,/^(?:(-?([0-9]|[1-9][0-9]+))(\.[0-9]+)?([eE][-+]?[0-9]+)?\b)/,/^(?:"(?:\\[\\"bfnrt/]|\\u[a-fA-F0-9]{4}|[^\\\0-\x09\x0a-\x1f"])*")/,/^(?:\{)/,/^(?:\})/,/^(?:\[)/,/^(?:\])/,/^(?:,)/,/^(?::)/,/^(?:true\b)/,/^(?:false\b)/,/^(?:null\b)/,/^(?:$)/,/^(?:.)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13],"inclusive":true}}
};
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = jsonlint;
exports.Parser = jsonlint.Parser;
exports.parse = function () { return jsonlint.parse.apply(jsonlint, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
}).call(this,require("FWaASH"))
},{"FWaASH":5,"fs":2,"path":4}],21:[function(require,module,exports){
(function() {
  var slice = [].slice;

  function queue(parallelism) {
    var q,
        tasks = [],
        started = 0, // number of tasks that have been started (and perhaps finished)
        active = 0, // number of tasks currently being executed (started but not finished)
        remaining = 0, // number of tasks not yet finished
        popping, // inside a synchronous task callback?
        error = null,
        await = noop,
        all;

    if (!parallelism) parallelism = Infinity;

    function pop() {
      while (popping = started < tasks.length && active < parallelism) {
        var i = started++,
            t = tasks[i],
            a = slice.call(t, 1);
        a.push(callback(i));
        ++active;
        t[0].apply(null, a);
      }
    }

    function callback(i) {
      return function(e, r) {
        --active;
        if (error != null) return;
        if (e != null) {
          error = e; // ignore new tasks and squelch active callbacks
          started = remaining = NaN; // stop queued tasks from starting
          notify();
        } else {
          tasks[i] = r;
          if (--remaining) popping || pop();
          else notify();
        }
      };
    }

    function notify() {
      if (error != null) await(error);
      else if (all) await(error, tasks);
      else await.apply(null, [error].concat(tasks));
    }

    return q = {
      defer: function() {
        if (!error) {
          tasks.push(arguments);
          ++remaining;
          pop();
        }
        return q;
      },
      await: function(f) {
        await = f;
        all = false;
        if (!remaining) notify();
        return q;
      },
      awaitAll: function(f) {
        await = f;
        all = true;
        if (!remaining) notify();
        return q;
      }
    };
  }

  function noop() {}

  queue.version = "1.0.7";
  if (typeof define === "function" && define.amd) define(function() { return queue; });
  else if (typeof module === "object" && module.exports) module.exports = queue;
  else this.queue = queue;
})();

},{}],22:[function(require,module,exports){
module.exports = element;
module.exports.pair = pair;
module.exports.format = format;
module.exports.formatPair = formatPair;

function element(x, dims) {
    return search(x, dims).val;
}

function formatPair(x) {
    return format(x.lat, 'lat') + ' ' + format(x.lon, 'lon');
}

// Is 0 North or South?
function format(x, dim) {
    var dirs = {
            lat: ['N', 'S'],
            lon: ['E', 'W']
        }[dim] || '',
        dir = dirs[x >= 0 ? 0 : 1],
        abs = Math.abs(x),
        whole = Math.floor(abs),
        fraction = abs - whole,
        fractionMinutes = fraction * 60,
        minutes = Math.floor(fractionMinutes),
        seconds = Math.floor((fractionMinutes - minutes) * 60);

    return whole + '° ' +
        (minutes ? minutes + "' " : '') +
        (seconds ? seconds + '" ' : '') + dir;
}

function search(x, dims, r) {
    if (!dims) dims = 'NSEW';
    if (typeof x !== 'string') return { val: null, regex: r };
    r = r || /[\s\,]*([\-|\—|\―]?[0-9.]+)°? *(?:([0-9.]+)['’′‘] *)?(?:([0-9.]+)(?:''|"|”|″) *)?([NSEW])?/gi;
    var m = r.exec(x);
    if (!m) return { val: null, regex: r };
    else if (m[4] && dims.indexOf(m[4]) === -1) return { val: null, regex: r };
    else return {
        val: (((m[1]) ? parseFloat(m[1]) : 0) +
            ((m[2] ? parseFloat(m[2]) / 60 : 0)) +
            ((m[3] ? parseFloat(m[3]) / 3600 : 0))) *
            ((m[4] && m[4] === 'S' || m[4] === 'W') ? -1 : 1),
        regex: r,
        raw: m[0],
        dim: m[4]
    };
}

function pair(x, dims) {
    x = x.trim();
    var one = search(x, dims);
    if (one.val === null) return null;
    var two = search(x, dims, one.regex);
    if (two.val === null) return null;
    // null if one/two are not contiguous.
    if (one.raw + two.raw !== x) return null;
    if (one.dim) return swapdim(one.val, two.val, one.dim);
    else return [one.val, two.val];
}

function swapdim(a, b, dim) {
    if (dim == 'N' || dim == 'S') return [a, b];
    if (dim == 'W' || dim == 'E') return [b, a];
}

},{}],23:[function(require,module,exports){
(function (process){
toGeoJSON = (function() {
    'use strict';

    var removeSpace = (/\s*/g),
        trimSpace = (/^\s*|\s*$/g),
        splitSpace = (/\s+/);
    // generate a short, numeric hash of a string
    function okhash(x) {
        if (!x || !x.length) return 0;
        for (var i = 0, h = 0; i < x.length; i++) {
            h = ((h << 5) - h) + x.charCodeAt(i) | 0;
        } return h;
    }
    // all Y children of X
    function get(x, y) { return x.getElementsByTagName(y); }
    function attr(x, y) { return x.getAttribute(y); }
    function attrf(x, y) { return parseFloat(attr(x, y)); }
    // one Y child of X, if any, otherwise null
    function get1(x, y) { var n = get(x, y); return n.length ? n[0] : null; }
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.normalize
    function norm(el) { if (el.normalize) { el.normalize(); } return el; }
    // cast array x into numbers
    function numarray(x) {
        for (var j = 0, o = []; j < x.length; j++) o[j] = parseFloat(x[j]);
        return o;
    }
    function clean(x) {
        var o = {};
        for (var i in x) if (x[i]) o[i] = x[i];
        return o;
    }
    // get the content of a text node, if any
    function nodeVal(x) { if (x) {norm(x);} return x && x.firstChild && x.firstChild.nodeValue; }
    // get one coordinate from a coordinate array, if any
    function coord1(v) { return numarray(v.replace(removeSpace, '').split(',')); }
    // get all coordinates from a coordinate array as [[],[]]
    function coord(v) {
        var coords = v.replace(trimSpace, '').split(splitSpace),
            o = [];
        for (var i = 0; i < coords.length; i++) {
            o.push(coord1(coords[i]));
        }
        return o;
    }
    function coordPair(x) { return [attrf(x, 'lon'), attrf(x, 'lat')]; }

    // create a new feature collection parent object
    function fc() {
        return {
            type: 'FeatureCollection',
            features: []
        };
    }

    var serializer;
    if (typeof XMLSerializer !== 'undefined') {
        serializer = new XMLSerializer();
    // only require xmldom in a node environment
    } else if (typeof exports === 'object' && typeof process === 'object' && !process.browser) {
        serializer = new (require('xmldom').XMLSerializer)();
    }
    function xml2str(str) { return serializer.serializeToString(str); }

    var t = {
        kml: function(doc, o) {
            o = o || {};

            var gj = fc(),
                // styleindex keeps track of hashed styles in order to match features
                styleIndex = {},
                // atomic geospatial types supported by KML - MultiGeometry is
                // handled separately
                geotypes = ['Polygon', 'LineString', 'Point', 'Track'],
                // all root placemarks in the file
                placemarks = get(doc, 'Placemark'),
                styles = get(doc, 'Style');

            for (var k = 0; k < styles.length; k++) {
                styleIndex['#' + attr(styles[k], 'id')] = okhash(xml2str(styles[k])).toString(16);
            }
            for (var j = 0; j < placemarks.length; j++) {
                gj.features = gj.features.concat(getPlacemark(placemarks[j]));
            }
            function gxCoord(v) { return numarray(v.split(' ')); }
            function gxCoords(root) {
                var elems = get(root, 'coord', 'gx'), coords = [];
                for (var i = 0; i < elems.length; i++) coords.push(gxCoord(nodeVal(elems[i])));
                return coords;
            }
            function getGeometry(root) {
                var geomNode, geomNodes, i, j, k, geoms = [];
                if (get1(root, 'MultiGeometry')) return getGeometry(get1(root, 'MultiGeometry'));
                if (get1(root, 'MultiTrack')) return getGeometry(get1(root, 'MultiTrack'));
                for (i = 0; i < geotypes.length; i++) {
                    geomNodes = get(root, geotypes[i]);
                    if (geomNodes) {
                        for (j = 0; j < geomNodes.length; j++) {
                            geomNode = geomNodes[j];
                            if (geotypes[i] == 'Point') {
                                geoms.push({
                                    type: 'Point',
                                    coordinates: coord1(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'LineString') {
                                geoms.push({
                                    type: 'LineString',
                                    coordinates: coord(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'Polygon') {
                                var rings = get(geomNode, 'LinearRing'),
                                    coords = [];
                                for (k = 0; k < rings.length; k++) {
                                    coords.push(coord(nodeVal(get1(rings[k], 'coordinates'))));
                                }
                                geoms.push({
                                    type: 'Polygon',
                                    coordinates: coords
                                });
                            } else if (geotypes[i] == 'Track') {
                                geoms.push({
                                    type: 'LineString',
                                    coordinates: gxCoords(geomNode)
                                });
                            }
                        }
                    }
                }
                return geoms;
            }
            function getPlacemark(root) {
                var geoms = getGeometry(root), i, properties = {},
                    name = nodeVal(get1(root, 'name')),
                    styleUrl = nodeVal(get1(root, 'styleUrl')),
                    description = nodeVal(get1(root, 'description')),
                    extendedData = get1(root, 'ExtendedData');

                if (!geoms.length) return [];
                if (name) properties.name = name;
                if (styleUrl && styleIndex[styleUrl]) {
                    properties.styleUrl = styleUrl;
                    properties.styleHash = styleIndex[styleUrl];
                }
                if (description) properties.description = description;
                if (extendedData) {
                    var datas = get(extendedData, 'Data'),
                        simpleDatas = get(extendedData, 'SimpleData');

                    for (i = 0; i < datas.length; i++) {
                        properties[datas[i].getAttribute('name')] = nodeVal(get1(datas[i], 'value'));
                    }
                    for (i = 0; i < simpleDatas.length; i++) {
                        properties[simpleDatas[i].getAttribute('name')] = nodeVal(simpleDatas[i]);
                    }
                }
                return [{
                    type: 'Feature',
                    geometry: (geoms.length === 1) ? geoms[0] : {
                        type: 'GeometryCollection',
                        geometries: geoms
                    },
                    properties: properties
                }];
            }
            return gj;
        },
        gpx: function(doc, o) {
            var i,
                tracks = get(doc, 'trk'),
                routes = get(doc, 'rte'),
                waypoints = get(doc, 'wpt'),
                // a feature collection
                gj = fc();
            for (i = 0; i < tracks.length; i++) {
                gj.features.push(getLinestring(tracks[i], 'trkpt'));
            }
            for (i = 0; i < routes.length; i++) {
                gj.features.push(getLinestring(routes[i], 'rtept'));
            }
            for (i = 0; i < waypoints.length; i++) {
                gj.features.push(getPoint(waypoints[i]));
            }
            function getLinestring(node, pointname) {
                var j, pts = get(node, pointname), line = [];
                for (j = 0; j < pts.length; j++) {
                    line.push(coordPair(pts[j]));
                }
                return {
                    type: 'Feature',
                    properties: getProperties(node),
                    geometry: {
                        type: 'LineString',
                        coordinates: line
                    }
                };
            }
            function getPoint(node) {
                var prop = getProperties(node);
                prop.ele = nodeVal(get1(node, 'ele'));
                prop.sym = nodeVal(get1(node, 'sym'));
                return {
                    type: 'Feature',
                    properties: prop,
                    geometry: {
                        type: 'Point',
                        coordinates: coordPair(node)
                    }
                };
            }
            function getProperties(node) {
                var meta = ['name', 'desc', 'author', 'copyright', 'link',
                            'time', 'keywords'],
                    prop = {},
                    k;
                for (k = 0; k < meta.length; k++) {
                    prop[meta[k]] = nodeVal(get1(node, meta[k]));
                }
                return clean(prop);
            }
            return gj;
        }
    };
    return t;
})();

if (typeof module !== 'undefined') module.exports = toGeoJSON;

}).call(this,require("FWaASH"))
},{"FWaASH":5,"xmldom":3}],24:[function(require,module,exports){
var Place = require('./lib/draw.place.js'),
    Point = require('./lib/draw.point.js'),
    fs = require('fs');

var templates = {
    map_tip_message: _("<div class='small pad1x clearfix truncate'>\n  <span class='inline icon info pad1y'><%=obj.message%></span>\n  <% if (!obj.noclose) { %>\n  <a id='cancel-tip' href='#browse' class='pin-right unround button quiet icon close pad1 inline'>Cancel</a>\n  <% } %>\n</div>\n").template()
};

module.exports = function(App, markers, editor) {

    var exports = {};

    exports.mode = null;

    exports.handlers = {
        place: Place(App, editor.map),
        point: Point(editor.map),
        polygon: new L.Draw.Polygon(editor.map),
        linestring: new L.Draw.Polyline(editor.map, {
            showLength: false
        })
    };

    editor.map.on('place:created', addAndEdit)
        .on('point:created', addAndEdit)
        .on('draw:created', addAndEdit)
        .on('draw:edited', update)
        .on('draw:deleted', update);

    exports.onhashchange = function() {
        if (window.location.hash === '#app') exports.clear();
    };

    exports.activate = function(type, editing) {
        exports.handlers.point.disable();
        exports.handlers.polygon.disable();
        exports.handlers.linestring.disable();
        exports.handlers.place.disable();
        hideHint();

        type = type || 'browse';
        $('.draw-controls a.active').removeClass('active');
        $('a#draw-' + type).addClass('active');

        if (type === 'menu') {
            $('#data').addClass('mode-menu');
        } else {
            $('#data').removeClass('mode-menu');
        }

        if (editing) {
            $('#data').addClass('mode-edit');
        } else {
            $('#data').removeClass('mode-edit');
            markers.clear();
            if (type === 'polygon') {
                showHint('Click first point to close this polygon.');
                exports.handlers.polygon.enable();
            } else if (type === 'linestring') {
                showHint('Click last point to finish the line.');
                exports.handlers.linestring.enable();
            } else if (type === 'point') {
                showHint('Click anywhere on the map to place a point.');
                exports.handlers.point.enable();
            } else if (type === 'browse') {
                showHint("Draw or <a href='#' class='marker-import-manual'>import</a> .geojson, .csv, .kml, or .gpx files.", true);
                exports.handlers.place.disable();
            }
        }
        exports.mode = type;
    };

    // Wrapper around exports.activate that resets to default draw state.
    exports.clear = function() {
        exports.activate('browse');
    };

    markers.on('del', onDel);
    markers.on('edit', exports.activate);

    // Explicitly trigger a place being created.
    exports.place = function(ev) {
        exports.activate('browse');
        exports.handlers.place.popup(ev);
    };

    function update(e) {
        editor.changed();
    }

    function addAndEdit(e) {
        var feature = markers.addFeature(
            markers.initializeFeature(e.layer.toGeoJSON()));
        markers.highlightFeature(feature);
        markers.syncUI();
        analytics.track('Drew a ' + feature.geometry.type);
        markers.edit(feature.properties.id, false);
        // Disable redraw for now which is conceptually wonky in sequence
        // with edit form being non-persistent.
        // hideHint();
        // setTimeout(function() {
        //     exports.activate(mode);
        // }, 10);
    }

    function showHint(msg, noclose) {
        $('#marker-help').addClass('active');
        $('#marker-help').html(templates.map_tip_message({
            message: msg,
            noclose: noclose
        }));
    }

    function hideHint() {
        $('#marker-help').removeClass('active');
    }

    // on marker deletion
    function onDel() {
        exports.activate(exports.mode);
    }


    // Initialize.
    exports.clear();

    return exports;
};

},{"./lib/draw.place.js":31,"./lib/draw.point.js":32,"fs":2}],25:[function(require,module,exports){
var toGeoJSON = require('togeojson'),
    geojsonFlatten = require('geojson-flatten'),
    csv2geojson = require('csv2geojson'),
    geojsonNormalize = require('geojson-normalize'),
    geocode = require('geocode-many'),
    fs = require('fs');

var templates = {
    propertyassign: _("<div id='import' class='modal-popup limiter'>\n  <div class='col8 modal-body fill-white contain'>\n    <a href='#close' class='quiet pad1 icon fr close'></a>\n    <div class='pad2y pad4x center'>\n      <h2>Import features</h2>\n    </div>\n    <div class='space-bottom2 clearfix'>\n      <div class='col10 margin1'>\n        <% var popupProperties = [{\n            name: 'title',\n            help: 'Choose an imported property to give each feature a popup title.'\n          }, {\n            name: 'description',\n            help: 'Choose an imported property to give each feature a popup description.'\n        }]; %>\n        <div class='tabs col12 space-bottom clearfix'>\n          <% if (allpoints) { %>\n            <% if (!geojson) { %>\n              <a href='#active1' class='active col6'>Style</a>\n              <a href='#active2' class='col6'>Symbol</a>\n            <% } else { %>\n              <a href='#active1' class='active col3'>Title</a>\n              <a href='#active2' class='col3'>Description</a>\n              <a href='#active3' class='col3'>Style</a>\n              <a href='#active4' class='col3'>Symbol</a>\n            <% } %>\n          <% } else { %>\n            <a href='#active1' class='active col6'>Title</a>\n            <a href='#active2' class='col6'>Description</a>\n          <% } %>\n        </div>\n\n        <div class='property-panes sliding h active1 col12 row5 clip contain'>\n          <% if (geojson) { %>\n            <% _(popupProperties).each(function(field) { %>\n            <div class='col12 animate'>\n              <div class='col12 scroll-v round keyline-all row4'>\n                <% _(_(obj.geojson).pairs()).each(function(f, i) { %>\n                <input id='<%- field.name %>-<%- f[0] %>' class='label-select' data-geojson='<%- field.name %>.<%- f[0] %>' type='radio' name='<%- field.name %>' value='<%- f[0] %>' <% if (f[0].toLowerCase().replace(/\\s/g, '') === field.name) { %>checked=true<% } %> />\n                <label class='col12 truncate <% if (i !== 0) { %>keyline-top<% } %> pad1y pad2x row1' for='<%- field.name %>-<%- f[0] %>'>\n                  <%- f[0].replace(/<[^<]+>/g, '').trim() %>\n                  <% if (f[1]) { %>\n                    <% var example = (typeof f[1] === 'string') ? f[1].replace(/<[^<]+>/g, '').trim() : f[1]; %>\n                    <em class='small quiet'>(<%- example %>)</em>\n                  <% } %>\n                </label>\n                <% }); %>\n              </div>\n              <div class='center pad1y'>\n                <p><%- field.help %></p>\n              </div>\n            </div>\n            <% }); %>\n          <% } %>\n\n          <% if (allpoints) { %>\n            <div class='col12 animate'>\n              <div class='fill-darken0 pad1'>\n                <% print(obj.style_template(_({\n                    context: 'import'\n                  }).defaults({ properties: obj.markerDefaults })));\n                %>\n              </div>\n              <div class='center pad1y'>\n                <p>Style each imported marker with a size &amp; color.</p>\n              </div>\n            </div>\n            <div class='col12 animate'>\n              <% print(obj.symbol_template(_({\n                  context: 'import'\n                }).defaults({ properties: obj.markerDefaults }))); %>\n              <div class='center pad1y'>\n                <p>Provide each imported marker with a symbol icon.</p>\n              </div>\n            </div>\n          <% } %>\n        </div>\n      </div>\n    </div>\n    <div class='clearfix fill-gray pad2y'>\n      <a href='#' id='import-assign' class='col6 margin3 button icon up'>Finish importing</a>\n    </div>\n  </div>\n</div>\n").template(),
    autogeocode: _("<div id='geocode' class='modal-popup limiter'>\n  <div class='col8 modal-body fill-white contain'>\n    <a href='#close' class='quiet pad1 icon fr close'></a>\n\n    <div class='processing hidden'>\n      <div class='pad2y pad4x center'>\n        <h2>Geocoding</h2>\n      </div>\n      <div class='pad2y clearfix fill-light'>\n        <div class='col10 margin1'>\n          <div class='progress round-top fill-white pad0 contain round'>\n            <div class='fill fill-blue pin-left round'></div>\n          </div>\n          <div class='center pad0y'>\n            <span class='percent quiet'>0</span>\n          </div>\n        </div>\n      </div>\n    </div>\n\n    <div class='setup'>\n      <div class='pad2y pad4x center'>\n        <h2>Choose fields to geocode</h2>\n      </div>\n      <div class='space-bottom2 clearfix'>\n        <div class='col10 margin1'>\n          <div class='col12 row4 clip contain'>\n            <div class='col12 scroll-v round keyline-all row4'>\n            <% _(_(obj.csv).pairs()).each(function(f, i) { %>\n              <input id='name-<%- f[0] %>' class='label-select' data-query='<%- f[0] %>' type='checkbox' name='column-name' value='<%- f[0] %>' <% if (f[0].toLowerCase().replace(/\\s/g, '') === 'address') { %>checked=true<% } %> />\n              <label class='col12 truncate <% if (i !== 0) { %>keyline-top<% } %> pad1y pad2x row1' for='name-<%- f[0] %>'>\n                <%- f[0].replace(/<[^<]+>/g, '').trim() %>\n                <% if (f[1]) { %>\n                  <% var example = (typeof f[1] === 'string') ? f[1].replace(/<[^<]+>/g, '').trim() : f[1]; %>\n                  <em class='small quiet'>(<%- example %>)</em>\n                <% } %>\n              </label> \n            <% }); %>\n            </div>\n          </div>\n          <div class='center pad1y'>\n            <p>Select one or more fields with address data in your csv to help geocode.</p>\n          </div>\n        </div>\n      </div>\n      <div class='clearfix fill-gray pad2y'>\n        <a href='#' id='geocode-submit' class='col6 margin3 button rcon next'>Geocode data</a>\n      </div>\n    </div>\n  </div>\n</div>\n").template(),
    symbol: _("<div class='pager js-tabs pad1 pill pin-right'>\n  <a href='#marker-edit-symbol-pages' class='col12 quiet full button icon big up round-top quiet'></a>\n  <a href='#marker-edit-symbol-pages' class='col12 quiet full button icon big down round-bottom quiet'></a>\n</div>\n<div id='marker-edit-symbol-pages' class='marker-edit-symbol sliding v active1 clip row4'>\n  <%\n  if (!window.MakiFull) {\n    var icons = window.Maki.slice(0);\n    icons.unshift({ alpha:true, icon:'' });\n    icons = icons.concat(_(10).chain().range().map(function(v) { return { alpha:true, icon:v } }).value());\n    icons = icons.concat(_(26).chain().range().map(function(v) { return { alpha:true, icon:String.fromCharCode(97 + v) } }).value());\n    window.MakiFull = icons;\n  }\n  _(window.MakiFull).chain()\n  .filter(function(icon) { return !icon.tags || icon.tags.indexOf('deprecated') === -1 })\n  .groupBy(function(icon, i) {\n    return Math.floor(i/60);\n  })\n  .each(function(group, i) { %>\n    <div class='animate col12 clearfix row5'>\n    <% _(group).each(function(icon) { %>\n        <input id='<%- context %>-marker-symbol-<%-icon.icon%>' class='label-select' data-geojson='marker-symbol.<%- icon.icon %>' type='radio' name='marker-symbol' value='<%-icon.icon%>' <%- obj['marker-symbol'] === icon.icon ? 'checked' : '' %> />\n      <% if (icon.alpha) { %>\n      <label for='<%- context %>-marker-symbol-<%-icon.icon%>' class='col1 symbol center round'><span class='maki-icon strong alpha'><%-icon.icon%></span></label>\n      <% } else { %>\n      <label for='<%- context %>-marker-symbol-<%-icon.icon%>' class='col1 symbol center round' title='<%-icon.name%>'><span class='maki-icon <%-icon.icon%>'></span></label>\n      <% } %>\n    <% }); %>\n  </div>\n  <% }); %>\n</div>\n").template(),
    style: _("<div class='clearfix space-bottom js-tabs pill'><!--\n--><input id='<%- context %>-marker-size-small' class='label-select' data-geojson='marker-size.small' type='radio' name='marker-size' value='small' <%- obj.properties['marker-size'] === 'small' ? 'checked' : '' %> /><!--\n--><label for='<%- context %>-marker-size-small' class='col3 button'>Small</label><!--\n--><input id='<%- context %>-marker-size-medium' class='label-select' data-geojson='marker-size.medium' type='radio' name='marker-size' value='medium' <%- obj.properties['marker-size'] === 'medium' ? 'checked' : '' %> /><!--\n--><label for='<%- context %>-marker-size-medium' class='col3 button'>Medium</label><!--\n--><input id='<%- context %>-marker-size-large' class='label-select' data-geojson='marker-size.large' type='radio' name='marker-size' value='large' <%- obj.properties['marker-size'] === 'large' ? 'checked' : '' %> /><!--\n--><label for='<%- context %>-marker-size-large' class='col3 button'>Large</label>\n  <div class='col3 row1 style-input-wrapper'>\n    <input id='marker-color' name='marker-color' type='text' class='small center code col12 row1 js-noTabExit color-hex' maxlength='7' style=\"padding: 10px 5px;\" placeholder=\"<%- obj.properties['marker-color'] ? obj.properties['marker-color'] : '#7d7d7d' %>\" />\n  </div>\n</div>\n<div class='clearfix clip round'>\n  <% _(App.colors).each(function(color) { %>\n  <input id='<%- context %>-marker-color-<%-color%>' class='label-select' type='radio' data-geojson='marker-color.<%- color %>' name='marker-color' value='#<%-color%>' <%- obj.properties['marker-color'] === '#' + color ? 'checked' : '' %> />\n  <label for='<%- context %>-marker-color-<%-color%>' class='dark swatch center clip icon check row1 col1' style='background-color:#<%-color%>'></label>\n  <% }); %>\n</div>\n").template()
};

exports.mapDragEnter = function(ev) {
    ev.originalEvent.dataTransfer.dropEffect = 'copy';
    ev.preventDefault();
    ev.stopPropagation();
    this.dropzone.toggleClass('active', true);
};

exports.mapDragLeave = function(ev) {
    ev.originalEvent.dataTransfer.dropEffect = 'copy';
    ev.preventDefault();
    ev.stopPropagation();
    this.dropzone.toggleClass('active', false);
};

exports.mapDrop = function(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    var event = ev.originalEvent;
    var view = this;
    var manual = $(ev.currentTarget).val();

    if (manual || event.dataTransfer &&
        event.dataTransfer.files && event.dataTransfer.files.length) {
        var file = (event.dataTransfer) ?
        event.dataTransfer.files[0] :
        ev.currentTarget.files[0];
        this.dropzone.toggleClass('active loading', true);
        handleFile(file, done);
    } else {
        done('No files were dropped');
    }

    function done(err, geojson) {
        view.dropzone.toggleClass('active loading', false);
        if (err && err.code != 'closed') return Views.modal.show('err', { message: err });
        if (geojson) return view.markers.concat(geojson);
    }
};

exports.handleFile = handleFile;

function handleFile(file, cb) {
    switch (detectType(file)) {
        case 'geojson':
            readGeoJSON(file, cb);
            analytics.track('supported drop', {
                type: 'geojson'
            });
            break;
        case 'kml':
            readKML(file, cb);
            analytics.track('supported drop', {
                type: 'kml'
            });
            break;
        case 'dsv':
            readDSV(file, cb);
            analytics.track('supported drop', {
                type: 'csv'
            });
            break;
        case 'gpx':
            readGPX(file, cb);
            analytics.track('supported drop', {
                type: 'gpx'
            });
            break;
        case 'shp':
        case 'zip':
        case 'shx':
        case 'dbf':
        case 'qpj':
        case 'prj':
            analytics.track('unsupported drop', {
                type: otherType(file)
            });
            return cb('File type ' + otherType(file) +
                ' is unsupported.<div class="pad2y">Uploading a shapefile?' +
                'Try using <a href="http://www.shpescape.com/" target="_blank">Shape Escape</a> to convert your data to another format before uploading.</div><small class="quiet">Supported formats: .geojson, .csv, .kml, or .gpx</small>');
        default:
            analytics.track('unsupported drop', {
                type: otherType(file)
            });
            return cb('File type ' + otherType(file) + ' is unsupported.');
    }
}

function detectType(f) {
    var filename = f.name ? f.name.toLowerCase() : '';
    function ext(_) {
        return filename.indexOf(_) !== -1;
    }
    if (f.type === 'application/vnd.google-earth.kml+xml' || ext('.kml')) {
        return 'kml';
    }
    if (ext('.gpx')) return 'gpx';
    if (ext('.geojson') || ext('.json') || ext('.topojson')) return 'geojson';
    if (f.type === 'text/csv' || ext('.csv') || ext('.tsv') || ext('.dsv')) {
        return 'dsv';
    }
    if (ext('.xml') || ext('.osm')) return 'xml';
}

function otherType(f) {
    var filename = f.name ? f.name.toLowerCase() : '',
        pts = filename.split('.');
    if (pts.length > 1) return pts[pts.length - 1];
    else return 'unknown';
}

function readAsText(f, callback) {
    try {
        var reader = new FileReader();
        reader.readAsText(f);
        reader.onload = function(e) {
            if (e.target && e.target.result) callback(null, e.target.result);
            else callback({
                message: 'Dropped file could not be loaded'
            });
        };
        reader.onerror = function(e) {
            callback({
                message: 'Dropped file was unreadable'
            });
        };
    } catch (e) {
        callback({
            message: 'Dropped file was unreadable'
        });
    }
}

function showModal(geojson, callback) {
    if (geojson.features &&
        geojson.features.length &&
        'properties' in geojson.features[0]) {

        var noprops = _(geojson.features[0].properties).isEmpty();
        var allpoints = geojson.features.every(function(f) {
            return f && f.geometry && f.geometry.type === 'Point';
        });

        if (noprops && !allpoints) {
            callback(null, geojson);
        } else {
            Views.modal.show('propertyassign', {
                template: templates.propertyassign,
                symbol_template: templates.symbol,
                style_template: templates.style,
                geojson: (noprops) ? undefined : geojson.features[0].properties,
                allpoints: allpoints,
                markerDefaults: {
                    title: '',
                    description: ''
                }
            }, function(err, res) {
                if (err) return callback(err, res);
                if (res) {
                    Views.modal.done('propertyassign');
                    callback(null, assignProps(geojson, res));
                }
            });
        }
    } else {
        return callback('Could not parse file to build a .geojson document.');
    }
}

function assignProps(geojson, props) {
    geojson.features.forEach(function(f) {
        f.properties.title = (props.title) ?
            f.properties[props.title] : '';
        f.properties.description = (props.description) ?
            f.properties[props.description] : '';
        f.properties['marker-color'] = (props['marker-color']) ?
            props['marker-color'] : '';
        f.properties['marker-size'] = (props['marker-size']) ?
            props['marker-size'] : '';
        f.properties['marker-symbol'] = (props['marker-symbol']) ?
            props['marker-symbol'] : '';
    });
    return geojson;
}

function readKML(file, cb) {
    readAsText(file, function(err, res) {
        if (err) return cb(err.message);
        var kmldom = toDom(res),
            geojson = toGeoJSON.kml(kmldom);
        if (geojson) {
            geojson = geojsonFlatten(geojson);
            geojson.features.forEach(renameTitle);
            showModal(geojson, cb);
        } else {
            return cb('Could not read dropped KML');
        }
    });
}

function readDSV(file, cb) {
    readAsText(file, function(err, res) {
        if (err) return cb(err.message);
        csv2geojson.csv2geojson(res, function(err, geojson) {
            if (geojson) {
                showModal(geojson, cb);
            } else {
                if (err.message === 'Latitude and longitude fields not present') {
                    if (!App.user) return cb('You must be logged in order to upload data to the editor');
                    if (err.data.length > App.user.plan.geometries) return cb('The maximum number of features you can upload to your account is ' + App.user.plan.geometries);
                    // Attempt to geocode.
                    var data = err.data;
                    geocodeDSV(data, function(err, res) {
                        if (err) return cb('There was an error geocoding the data.');
                        if (res) {
                            showModal(res, cb);
                        }
                    });
                } else {
                    return cb('Could not read dropped CSV');
                }
            }
        });
    });
}

function geocodeDSV(data, cb) {
    Views.modal.show('autogeocode', {
        template: templates.autogeocode,
        csv: data[0]
    }, function(err, res) {
        if (err) return cb('No fields were selected to geocode.');
        if (res) {
            var queries = [];
            _(data).each(function(d) {
                var query = [];
                for (var k in d) if (res.indexOf(k) > -1) query.push(d[k]);
                queries.push({
                    name: query.join(', ')
                });
            });

            var geocoder = geocode(App.accessToken, 0);
            geocoder(queries, transform, progress, complete);
            Views.modal.modals.autogeocode.el.find('.processing')
                .removeClass('hidden')
                .addClass('active');
        }
    });

    function transform(obj) { return obj.name; }
    function progress(e) {
        var $this = Views.modal.modals.autogeocode.el;
        var ratio = 100 / e.todo;
        var percent = parseInt((e.done * ratio), 10);
        $this.find('.fill').css('width', percent + '%');
        $this.find('.percent').text(percent);
    }

    function complete(err, res) {
        if (res) {
            var geojson = {
                type: 'FeatureCollection',
                features: []
            };

            _(data).each(function(d, i) {
                // Handle err here:
                var lng = (res[i].longitude) ? res[i].longitude : 0;
                var lat = (res[i].latitude) ? res[i].latitude : 0;

                geojson.features.push({
                    geometry: {
                        coordinates: [lng, lat],
                        type: 'Point'
                    },
                    properties: d,
                    type: 'Feature'
                });
            });

            Views.modal.done('autogeocode');
            return cb(null, geojson);
        }
    }
}

function readGPX(file, cb) {
    readAsText(file, function(err, res) {
        if (err) return cb(err.message);
        var gpxdom = toDom(res),
            geojson = toGeoJSON.gpx(gpxdom);

        if (geojson) {
            geojson = geojsonFlatten(geojson);
            geojson.features.forEach(renameTitle);
            showModal(geojson, cb);
        } else {
            return cb('Could not read dropped GPX');
        }
    });
}

function readGeoJSON(file, cb) {
    readAsText(file, function(err, res) {
        if (err) return cb(err.message);
        try {
            var geojson = geojsonNormalize(JSON.parse(res));
            geojson = geojsonFlatten(geojson);
            if (geojson) {
                showModal(geojson, cb);
            } else {
                return cb('Could not read dropped GeoJSON');
            }
        } catch(e) {
            // invalid GeoJSON
            return cb('Could not read dropped GeoJSON: invalid JSON');
        }
    });
}

function renameTitle(f) {
    if (f.properties.name) f.properties.title = f.properties.name;
}

function toDom(x) {
    return (new DOMParser()).parseFromString(x, 'text/xml');
}

},{"csv2geojson":6,"fs":2,"geocode-many":9,"geojson-flatten":17,"geojson-normalize":18,"togeojson":23}],26:[function(require,module,exports){
var sexagesimal = require('sexagesimal'),
    fs = require('fs');

var templates = {
    results: _("<% if (obj.length) _(obj.slice(0,5)).each(function(r, idx) { %>\n<% var name = r.place_name.split(',')[0] || [\n    Math.abs(r.center[1]).toFixed(4) + '&deg;' + (r.center[1] >= 0 ? 'N' : 'S'),\n    Math.abs(r.center[0]).toFixed(4) + '&deg;' + (r.center[0] >= 0 ? 'E' : 'W')\n].join(', '); %>\n<% var place = _(r.context).chain().filter(function(v) { return v.id.indexOf('postcode') !== 0; }).pluck('text').value().join(', '); %>\n<input id='search-result-<%-idx%>' class='label-select' type='radio' name='search-result' value='<%-idx%>' <%- !idx ? 'checked' : '' %>/>\n<label for='search-result-<%-idx%>' class='keyline-left keyline-right block truncate pad1y pad4x fill-light keyline-bottom contain row1'>\n  <span class='pin-left pad1y pad1x'><span class='maki-icon <%-r.properties.maki || 'marker'%>'></span></span>\n  <strong><%-name%></strong>\n  <span class='small pad1x'><%-place%></span>\n</label>\n<% }); %>\n<% if (!obj.length) { %>\n<label class='block pad1y pad2x fill-light keyline-bottom keyline-left keyline-right row1'>No results</label>\n<% } %>\n").template()
};

module.exports = function(editor, map, draw) {
    var exports = {};
    exports.results = [];
    exports.wait = 0;
    exports.last = 0;
    exports.query = '';

    exports.carmen = L.mapbox.geocoder('mapbox.places');
    exports.field = $('#search input');
    exports.input = $('#search input').get(0);

    // Set the map view to the currently highlighted result.
    exports.setview = function(el) {
        var idx = $(el || '#search-results input:checked').val();

        // No results, bail.
        if (idx === undefined) return;

        var feature = exports.results.features[idx];
        if (feature.bbox) {
            map.fitBounds([[feature.bbox[1],feature.bbox[0]], [feature.bbox[3],feature.bbox[2]]]);
        } else if (feature.id.indexOf('address') === 0) {
            map.setView(L.latLng(feature.center[1], feature.center[0]), Math.max(16, map.getZoom()));
        } else if (feature.id.indexOf('street') === 0) {
            map.setView(L.latLng(feature.center[1], feature.center[0]), Math.max(15, map.getZoom()));
        } else {
            map.setView(L.latLng(feature.center[1], feature.center[0]), map.getZoom());
        }
        draw.place({ latlng: {
            lat: feature.center[1],
            lng: feature.center[0],
            title: feature.place_name.split(',')[0]
        }});
        exports.highlight(idx);
    };

    // Update the current selected result.
    exports.select = function(dir) {
        var $results = $('#search-results input');
        var $result = $('#search-results input:checked');
        var index = $results.index($result);
        var size = $results.size();
        if (dir !== 1 && dir !== -1) throw new Error('dir must be either -1 or 1');
        if (size <= 0) return;

        index = index < 0 ? size : index;
        index = (index + dir) % size;
        index = index < 0 ? index + size : index;

        exports.highlight(index);
    };

    // Highlight a search result by index.
    exports.highlight = function(idx) {
        $('#search-results input:checked').removeAttr('checked');
        $('#search-results input').eq(idx).prop('checked', true);
    };

    // Focus search field.
    exports.focus = function(e) {
        if (exports.field.is(':focus')) return;
        exports.input.focus();
    };

    // Retrieve a search result.
    exports.search = function(query) {
        var $results = $('#search-results');

        // This query is empty or only whitespace.
        if (/^\s*$/.test(query)) {
            $results.empty();
            exports.query = '';
            return null;
        }

        // This query is too short. Wait for more input chars.
        if (query.length < 3) return;

        // The query matches what is currently displayed.
        if (exports.query === query) return;

        var latlon = (function(q) {
            var parts = sexagesimal.pair(q);
            if (parts) return { lat: parts[0], lon: parts[1] };
        })(query);

        // carmen expects lon/lat but we want to accept lat/lon
        if (latlon) query = latlon.lon + ', ' + latlon.lat;

        var count = ++exports.wait;
        $('#search fieldset').addClass('spinner');
        exports.carmen.query(query, function(err, data) {
            // A more recent query finished before this one. Bail.
            if (count < exports.last) return;
            $('#search fieldset').removeClass('spinner');
            exports.last = count;
            exports.query = query;
            exports.results = (data && data.results) ? data.results : [];
            if (latlon) {
                exports.results[0] = exports.results[0] || [];
                exports.results[0].unshift(latlon);
            }
            $results.html(templates.results(exports.results.features));
        });
    };

    exports.debounced = _(exports.search).debounce(100);

    return exports;
};

},{"fs":2,"sexagesimal":22}],27:[function(require,module,exports){
var fs = require('fs');

var templates = {
    project_info: _("<div class='keyline-bottom contain fill-white pad2 small clearfix'>\n  <h3 class='truncate strong project-name'><%- obj.name %></h3>\n  <a href=\"/help\" class=\"pin-right block pad2\">Need help?</a>\n</div>\n\n<div class='pad2'>\n\n<div id='downloads' class='<% if (!obj.markers) { %> hidden <% } %> space-bottom2 clearfix small'>\n  <label class='block col2 pad0y strong small'>Data</label>\n  <div class='pill col10 clearfix'>\n    <a href='https://a.tiles.mapbox.com/v4/<%-obj.id%>/features.json?access_token=<%- App.user ? App.user.accessToken : App.accessToken %>' class='col6 button short icon down track-geojson-download'>GeoJSON</a>\n    <a href='https://a.tiles.mapbox.com/v4/<%-obj.id%>/features.kml?access_token=<%- App.user ? App.user.accessToken : App.accessToken %>' class='col6 button short icon down track-kml-download'>KML</a>\n  </div>\n</div>\n\n<div class='space-bottom2 small clearfix'>\n  <label for='mapid' class='block col2 pad0y strong small'>Map ID</label>\n  <div class='col10'>\n    <div class='space-bottom0 col12 contain clipboard-container'>\n      <input id='mapid' class='short small readonly code truncate mapid stretch' type='text' value='<%- obj.id %>' readonly />\n      <a title='Copy Map ID to clipboard' data-clipboard-text='<%- obj.id %>' class='pad0 icon quiet pin-bottomright js-clipboard clipboard'></a>\n    </div>\n    <label class=\"truncate block\"><em>\n      For <a class=\"inline track-js-docs\" href=\"/mapbox.js/\">Javascript</a>,\n      <a class=\"inline track-ios-docs\" href=\"/mapbox-ios-sdk/\">iOS</a>, and\n      <a class=\"inline track-api-docs\" href=\"/developers/api/\">Web services</a>.\n    </em></label>\n  </div>\n</div>\n\n<div class='space-bottom2 small contain clearfix'>\n  <label for='map-link' class='col2 block pad0y strong small'>Share</label>\n  <div class='link-container contain col10 clipboard-container'>\n    <input id='map-link' class='short small readonly truncate code stretch' type='text' value='<%= obj.share %>' />\n    <a title='Copy link to clipboard' data-clipboard-text='<%= obj.share %>' class='pad0 icon quiet pin-bottomright js-clipboard clipboard'></a>\n  </div>\n</div>\n\n<div class='contain clearfix'>\n  <label for='map-embed' class='strong pad0y col2 block small'>Embed</label>\n  <textarea id='map-embed' spellcheck='false' class='short col10 micro readonly code' type='text' value='' />\n  <a title='Copy link to clipboard' data-clipboard-text='' id='js-clipboard-embed' class='pad0 icon clipboard quiet js-clipboard pin-topright'></a>\n  <ul class='margin2 col10 info-details clearfix contain' id='embed-options'>\n    <li class='col3 checkbox'>\n      <input class='embed-option' type='checkbox' checked='true' id='zoompan' />\n      <label for='zoompan' class='pad0 truncate block micro icon check'>Zoom &amp; Pan</label>\n    </li>\n    <li class='col3 checkbox'>\n      <input class='embed-option' type='checkbox' checked='true' id='zoomwheel' />\n      <label for='zoomwheel' class='pad0 truncate block micro icon check'>Zoom Wheel</label>\n    </li>\n    <li class='col3 checkbox'>\n      <input class='embed-option' type='checkbox' checked='true' id='geocoder' />\n      <label for='geocoder' class='pad0 truncate block micro icon check'>Geocoder</label>\n    </li>\n    <li class='col3 checkbox'>\n      <input class='embed-option' type='checkbox' checked='true' id='share' />\n      <label for='share' class='pad0 truncate block micro icon check'>Link</label>\n    </li>\n  </ul>\n</div>\n\n<% if (!obj._rev) { %>\n<div class='pin-top pin-bottom fill-white pad4'>\n  <h3 class='title'>Save your project in order to:</h3>\n  <ul class='project-actions'>\n    <li class='clearfix contain space-bottom1'>\n      <p>Develop web and mobile apps with the project's Map ID.</p>\n    </li>\n    <li class='clearfix contain space-bottom1'>\n      <p>Share or embed your project.</p>\n    </li>\n    <li class='clearfix contain'>\n      <p>Download your data as GeoJSON or KML.</p>\n    </li>\n  </ul>\n</div>\n<% } %>\n\n</div>\n").template()
};

module.exports = function(editor, map, markers) {
    var exports = {};
    var $info = $('#project-info');

    function hashFormat(obj) {
        // trust the Bostock
        var precision = Math.max(0, Math.ceil(Math.log(obj.center[2]) / Math.LN2));
        return obj.center[2] + '/' +
            obj.center[1].toFixed(precision) + '/' +
            obj.center[0].toFixed(precision);
    }

    exports.render = function() {
        var project = _(editor.model.attributes).clone();
        project.share = 'https://a.tiles.mapbox.com/v4/' + project.id +
            '/page.html?access_token=' + (App.user ? App.user.accessToken : App.accessToken) + '#' + hashFormat(project);
        project.markers = editor.markers.model ? editor.markers.model.get('features').length : null;

        $info.html(templates.project_info(project));
    };

    return exports;
};

},{"fs":2}],28:[function(require,module,exports){
var fs = require('fs');

var templates = {
    layers_browse: _("<div id='layers-browse' class='modal-popup limiter'><div class='col6 modal-body fill-white contain'>\n  <a href='#close' class='quiet pad1 icon fr close'></a>\n  <div class='pad1y pad4x center'>\n    <h3>Click to add and remove layers</h3>\n  </div>\n  <div id='project-data-browse' class='row6 contain scroll-v fill-grey'></div>\n  <div class='searchbar'><fieldset class='with-icon block'>\n    <span class='icon search'></span>\n    <input id='project-data-search' type='text' class='stretch'/>\n  </fieldset></div>\n</div></div>\n").template(),
    project_layer: _("<a href='#project' class='quiet contain keyline-bottom data-layer clip clearfix <%- obj.active ? 'active': '' %>' data-id='<%-item.id%>'>\n  <span class='col9 truncate small icon document'>\n    <%- item.name || item.id %>\n  </span>\n</a>\n").template()
};

module.exports = function(App, map, editor) {
    var exports = {};
    var $layers = $('#project-layers');
    exports.rendered = false;
    exports.infos = null;
    exports.layers = null;

    exports.toggle = function(id) {
        var b = _(exports.layers).find(function(m) { return m.id === id; });
        return b ? exports.remove(id) : exports.add(id);
    };

    exports.add = function(id) {
        if (!exports.infos || !exports.layers) return;
        var a = _(exports.infos).find(function(m) { return m.id === id; });
        var b = _(exports.layers).find(function(m) { return m.id === id; });
        if (!a || b) return;
        exports.layers.push(a);
        exports.refresh();
    };

    exports.remove = function(id) {
        if (!exports.layers) return;
        exports.layers = _(exports.layers).filter(function(m) { return m.id !== id; });
        exports.refresh();
    };

    exports.setview = function(id) {
        if (!exports.infos || !exports.layers) return;
        var l = _(exports.layers).find(function(m) { return m.id === id; });
        if (!l || !l.center) return;
        var center = l.center;
        map.setView([center[1], center[0]], center[2]);
    };

    exports.refresh = function() {
        if (!exports.layers) return;
        var active = _(exports.layers).pluck('id');
        // Remove unused layers.
        _($('a.data-layer', $layers)).each(function(el) {
            if (active.indexOf($(el).data('id')) === -1) $(el).remove();
        });
        // Add active layers.
        _(exports.layers).each(function(l) {
            if ($('a:not(.removed)[data-id="' + l.id + '"]',$layers).size()) return;
            var el = $(templates.project_layer({
                item:l,
                active:active.indexOf(l.id) !== -1
            }));
            if (/^mapbox\./.test(l.id)) {
                $('div.base', $layers).prepend(el);
            } else {
                $('div.plus', $layers).prepend(el);
            }
        });
        // Update state of browser if present.
        var $browse = $('#project-data-browse');
        _($('a.data-layer', $browse)).each(function(el) {
            if (active.indexOf($(el).data('id')) === -1) {
                $(el).removeClass('active');
            } else {
                $(el).addClass('active');
            }
        });
        $('div.plus', $layers).sortable('destroy').sortable();
        // Redraw map.
        exports.redraw();
        $('#layers-tab').text((active.length > 1 ? active.length: '' )+ ' layers');
    };

    exports.redraw = _(function() {
        // Set model layers preserving any mapbox.* layers which
        // is the domain of the style editor.
        var base = _(editor.model.get('layers'))
            .filter(function(id) { return (/^mapbox\./).test(id); });
        var plus = _(exports.layers).chain()
            .pluck('id')
            .filter(function(id) { return !(/^mapbox\./).test(id); })
            .value();
        var layers = base.concat(plus);
        if (_(editor.model.get('layers')).isEqual(layers)) return;
        editor.model.set({layers:layers});
    }).throttle(500);

    exports.search = function(query) {
        if (!App.user) return;

        var $browse = $('#project-data-browse');
        var account = editor.model.id.split('.')[0];
        if (account === 'api') account = App.user.id;

        if (!exports.infos) {
            $browse.addClass('loading');
            exports.infos = [];
            var afterRaster = function(err, loaded) {
                if (err) return Views.modal.show('err', err);
                exports.infos = exports.infos.concat(_(loaded.models).pluck('attributes'));
                App.fetch('/api/Map?account=' + account + '&_type=tileset&_object=tm2style&private=1', afterStyle);
            };
            var afterStyle = function(err, loaded) {
                if (err) return Views.modal.show('err', err);
                exports.infos = exports.infos.concat(_(loaded.models).pluck('attributes'));
                $browse.removeClass('loading');
                return exports.search(query);
            };
            App.fetch('/api/Map?account=' + account + '&_type=tileset&_object=raster&private=1', afterRaster);
        } else {
            $browse.html(project_data({
                browse: exports.infos,
                search: query,
                active: _(exports.layers).pluck('id')
            }));
        }
    };

    function project_data(options) {
        var search = (options.search || '').toLowerCase();
        var items = _(options.browse).chain()
            .sortBy(function(item) {
                return (item.name||'').toLowerCase();
            })
            .filter(function(item) {
                return (item.name||'').toLowerCase().indexOf(options.search.toLowerCase()) !== -1;
            })
            .filter(function(item) {
                return item.status === 'available';
            }).value();

        return items.map(function(item, i) {
            return templates.project_layer({
                item: item,
                active: options.active.indexOf(item.id) !== -1
            });
        }).join('\n');
    }

    exports.browse = function() {
        if (!App.user) return;

        // Attempt a render in case it has not run to date.
        exports.render();

        Views.modal.show('layers-browse', {
            template: templates.layers_browse
        });
        exports.search('');
    };

    exports.render = function() {
        if (!App.user) return;

        exports.rendered = true;
        $layers.addClass('loading');
        var queue = editor.model.get('layers').slice(0);
        function get(queue, loaded) {
            if (queue.length) {
                App.tilejson(queue.shift(), function(err, tilejson) {
                    if (err && err.status !== 404) return Views.modal.show('err', err);
                    if (tilejson) loaded.push(tilejson);
                    get(queue, loaded);
                });
            } else {
                exports.layers = loaded;
                $layers.removeClass('loading');
                $('div.plus', $layers).sortable();
                $('div.plus', $layers).bind('sortupdate', function(ev, ui) {
                    var order = _($('a',$layers)).map(function(el) { return $(el).data('id'); });
                    exports.layers.sort(function(a, b) {
                        var ai = order.indexOf(a.id);
                        var bi = order.indexOf(b.id);
                        return ai < bi ? 1 : ai > bi ? -1 : 0;
                    });
                    exports.redraw();
                });
                exports.refresh();
            }
        }
        get(queue, []);
    };

    return exports;
};

},{"fs":2}],29:[function(require,module,exports){
var Streets = require('./streets');

module.exports.colorHSL = _(function(ev) {
    if (!ev.which) return;
    var target, id, x, y, w, h;
    if (this.colorSelectMode === 'sl') {
        target = this.colorSelectTarget;
        id = this.style.id({currentTarget:target});
        x = (ev.clientX - $(target).offset().left + window.pageXOffset);
        y = (ev.clientY - $(target).offset().top + window.pageYOffset);
        w = $(target).width();
        h = $(target).height();
        this.style.styles[id].s = Math.min(1,Math.max(0,x/w));
        this.style.styles[id].l = Math.min(1,Math.max(0,(1-(this.style.styles[id].s*0.5)) * (1-y/h)));
        this.style.render(id);
        ev.preventDefault();
    } else if (this.colorSelectMode === 'h') {
        target = this.colorSelectTarget;
        id = this.style.id({currentTarget:target});
        x = (ev.clientX - $(target).offset().left + window.pageXOffset);
        w = $(target).width();
        this.style.styles[id].h = Math.min(1,Math.max(0,x/w));
        this.style.render(id);
        ev.preventDefault();
    }
}).throttle(20);

module.exports.colorHex = _(function(ev) {
    var id = this.style.id(ev);
    var hex = $(ev.currentTarget).val();
    if (hex[0] !== '#') $(ev.currentTarget).val('#' + hex);

    hex = formatHex(hex);
    if ((/^#?([0-9a-f]{6})$/i).test(hex)) {
        var hsl = Streets.parseTintString(hex);
        this.style.styles[id].h = Streets.avg(hsl.h);
        this.style.styles[id].s = Streets.avg(hsl.s);
        this.style.styles[id].l = Streets.avg(hsl.l);
        this.style.render(id, true);
    }
}).throttle(20);

module.exports.colorClamp = _(function(ev) {
    var id = this.style.id(ev);
    var v = +$(ev.currentTarget).val();
    if ($(ev.currentTarget).attr('name') === 'a') {
        this.style.styles[id].a = +v;
    } else {
        this.style.styles[id][$(ev.currentTarget).attr('name')] = 0.5 - v;
    }
    this.style.render(id, true);
}).throttle(20);

module.exports.formatHex = formatHex;

function formatHex(hex) {
    if ((/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i).test(hex)) {
        hex = hex.replace(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i, '#$1$1$2$2$3$3');
    }
    return hex;
}

},{"./streets":38}],30:[function(require,module,exports){
module.exports.reset = function() {
    module.exports.Point = {
        title: '',
        description: '',
        'marker-size': 'medium',
        'marker-color': '#1087bf',
        'marker-symbol': ''
    };

    module.exports.LineString = {
        title: '',
        description: '',
        'stroke': '#1087bf',
        'stroke-width': 4,
        'stroke-opacity': 1
    };

    module.exports.Polygon = {
        title: '',
        description: '',
        'stroke': '#1087bf',
        'stroke-width': 4,
        'stroke-opacity': 1,
        'fill': '#1087bf',
        'fill-opacity': 0.2
    };
};

module.exports.reset();

},{}],31:[function(require,module,exports){
var latlngToFeature = require('./latlngtofeature'),
    fs = require('fs');

var templates = {
    popup: _("<div class='place-popup round'>\n  <a href='#data' class='place-marker small contain strong center round fill-white quiet pad1 block'>\n    <span class='maki-icon <%- obj.maki || 'marker' %>'></span>\n    <%- obj.title || 'New marker' %>\n  </a>\n</div>\n").template()
};

// Draw-like handler for place => marker interactions.
// Emits a map 'place:created' event when a marker is added.
module.exports = function(App, map) {
    var exports = {};
    exports.layer = null;

    // Use a flag + 200ms timeout to determine if a click is "really" a
    // single click before placing the marker UI.
    var single = false;

    exports.clear = function() {
        if (!exports.layer) return;
        var layer = exports.layer;
        exports.layer = null;
        map.removeLayer(layer);
    };

    exports.popup = function(ev) {
        exports.clear();
        exports.layer = L.marker(ev.latlng, {
            icon: L.divIcon({
                className: 'place-tmp'
            }),
            id: 'place-tmp'
        }).addTo(map);
        exports.layer.bindPopup(templates.popup(ev.latlng), {
            closeButton: false,
            className: 'place-popup-wrapper',
            maxWidth: 150
        });
        exports.layer.openPopup();
        $('.place-popup-wrapper .place-marker').click(clickPlace);
        exports.layer.on('popupclose', exports.clear);

        function clickPlace() {
            var feature = latlngToFeature(ev.latlng);
            var event = { layer: { toGeoJSON: function() { return feature; } } };
            map.fire('place:created', event);
            exports.clear();
            analytics.track('Placed a Marker');
        }
    };

    exports.disable = function() {
        exports.clear();
        map.on('mousedown', function() {
            exports.clear();
        });
    };

    return exports;
};

},{"./latlngtofeature":35,"fs":2}],32:[function(require,module,exports){
var latlngToFeature = require('./latlngtofeature');

// Draw-like handler for direct point addition.
// Emits a map 'point:created' event when a point is added.
module.exports = function(map) {
    var exports = {};

    exports.enable = function() {
        map.on('click', onclick);
        $('#map-app').addClass('crosshair-mode');
    };

    exports.disable = function() {
        map.off('click', onclick);
        $('#map-app').removeClass('crosshair-mode');
    };

    function onclick(ev) {
        var feature = latlngToFeature(ev.latlng);
        var event = { layer: { toGeoJSON: function() { return feature; } } };
        map.fire('point:created', event);
    }

    return exports;
};

},{"./latlngtofeature":35}],33:[function(require,module,exports){
module.exports = function(l) {
    if (l instanceof L.Marker) return l.getLatLng();

    var latlngs = l._latlngs,
    len = latlngs.length,
    i, j, p1, p2, f, center;

    for (i = 0, j = len - 1, area = 0, lat = 0, lng = 0; i < len; j = i++) {
        p1 = latlngs[i];
        p2 = latlngs[j];
        f = p1.lat * p2.lng - p2.lat * p1.lng;
        lat += (p1.lat + p2.lat) * f;
        lng += (p1.lng + p2.lng) * f;
        area += f / 2;
    }

    center = area ? new L.LatLng(lat / (6 * area), lng / (6 * area)) : latlngs[0];
    center.area = area;

    return center;
};

},{}],34:[function(require,module,exports){
module.exports = function(ev) {
    var $target = $(ev.currentTarget),
        $input = $target.siblings('input'),
        changed = false;

    $input.val(function(index, value) {
        var max = parseFloat($input.attr('max'));
        var min = parseFloat($input.attr('min'));
        var step = parseFloat($input.attr('step')) || 1;
        var increment = ($target.hasClass('increase')) ? step : 0 - step;
        newVal = parseFloat(value) + increment;

        if (newVal >= min && newVal <= max) {
            changed = true;
            return Math.round(newVal * 100) / 100;
        } else return value;
    });

    if (changed) { $input.trigger('change'); }
};

},{}],35:[function(require,module,exports){
var util = require('./util'),
    defaults = require('./defaults');

module.exports = function latlngToFeature(data) {
    return {
        type: 'Feature',
        properties: _({
            id: util.makeId(),
            title: data.title,
            description: data.description
        }).defaults(defaults.point),
        geometry: {
            type: 'Point',
            coordinates: [data.lng, data.lat]
        }
    };
};

},{"./defaults":30,"./util":39}],36:[function(require,module,exports){
module.exports = function(ev) {
    var el = $(ev.currentTarget);
    var dir = el.is('.up') ? -1 : 1;
    var parent = $('#' + el.attr('href').split('#').pop());

    // Pager requires the target to be a sliding container.
    if (!parent.is('.sliding')) return;

    // Bail on empty containers.
    var size = parent.children().size();
    if (size <= 0) return;

    // Search for a .activeN class and nuke it.
    var current = parent.attr('class').match(/active[0-9]+/);
    // Add the new appropriate active class.
    if (current) {
        var index = parseInt(current[0].split('active')[1],10) - 1;
        index = index + dir;
        if (index >= 0 && index < size) {
            parent.removeClass(current[0]);
            parent.addClass('active' + (index+1));
        }
    } else {
        parent.addClass('active1');
    }
    return false;
};

},{}],37:[function(require,module,exports){
// this is from simplestyle.js in mapbox.js
var defaults = {
    stroke: '#940000',
    'stroke-width': 2,
    'stroke-opacity': 1,
    fill: '#C78383',
    'fill-opacity': 0.1
};

var mapping = [
    ['stroke', 'color'],
    ['stroke-width', 'weight'],
    ['stroke-opacity', 'opacity'],
    ['fill', 'fillColor'],
    ['fill-opacity', 'fillOpacity']
];

function fallback(a, b) {
    var c = {};
    for (var k in b) {
        if (a[k] === undefined) c[k] = b[k];
        else c[k] = a[k];
    }
    return c;
}

function remap(a) {
    var d = {};
    for (var i = 0; i < mapping.length; i++) {
        d[mapping[i][1]] = a[mapping[i][0]];
    }
    return d;
}

module.exports = function style(feature) {
    return remap(fallback(feature.properties || {}, defaults));
};

},{}],38:[function(require,module,exports){
var Streets = Streets || {};

Streets.decode = function(id) {
    return _((id.split('+')[1]||'').split('_')).reduce(function(memo, part) {
        var key = part;
        var val = '0x1;0x1;0x1;0x1';
        if (part.indexOf('-') !== -1) {
            key = part.substr(0,part.indexOf('-'));
            val = part.substr(part.indexOf('-')+1);
        }
        switch(key) {
        case 'bg':
            if (!(/^[0-f]{6}$/.test(val))) break;
            memo[key] = val;
            break;
        case 'scale':
            val = parseInt(val,10);
            if (val !== 1 && val !== 2) break;
            memo[key] = val;
            break;
        case 'l10n':
            if (!/^(en|fr|de|es)$/.test(val)) break;
            memo[key] = val;
            break;
        case 'water':
        case 'streets':
        case 'landuse':
        case 'buildings':
            var tintstring = Streets.parseTintString(val);
            if (!tintstring.h) break;
            memo[key] = _(tintstring).defaults({ h:[0,1],s:[0,1],l:[0,1],a:[0,1] });
            break;
        }
        return memo;
    }, {
        bg:'',
        l10n:'',
        scale:1,
        landuse:   {h:[0,1],s:[0,1],l:[0,1],a:[0,0]},
        water:     {h:[0,1],s:[0,1],l:[0,1],a:[0,0]},
        buildings: {h:[0,1],s:[0,1],l:[0,1],a:[0,0]},
        streets:   {h:[0,1],s:[0,1],l:[0,1],a:[0,0]}
    });
};

Streets.encode = function(params) {
    var spec = _(['bg','l10n','scale','water','streets','landuse','buildings']).reduce(function(memo, key) {
        if (!params[key]) return memo;
        var val = params[key];
        switch (key) {
        case 'bg':
            if (!(/^[0-f]{6}$/.test(val))) break;
            memo.push(key + '-' + val);
            break;
        case 'l10n':
            if (!/^(en|fr|de|es)$/.test(val)) break;
            memo.push(key + '-' + val);
            break;
        case 'scale':
            val = parseInt(val,10);
            if (val !== 1 && val !== 2) break;
            memo.push(key + '-' + val);
            break;
        default:
            if (!val.h) break;
            memo.push(key + '-' + Streets.hsl2tint(val));
            break;
        }
        return memo;
    }, []).join('_');
    return spec;
};

// Convert an HSL object to a hex string.
Streets.hsl2rgba = function(hsl) {
    var rgb = (function hsl2rgb(h, s, l) {
        if (!s) return [l * 255, l * 255, l * 255];

        var m1, m2;
        var hueToRGB = function (m1, m2, h) {
            h = (h + 1) % 1;
            if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
            if (h * 2 < 1) return m2;
            if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6;
            return m1;
        };

        m2 = (l <= 0.5) ? l * (s + 1) : l + s - l * s;
        m1 = l * 2 - m2;
        return [
          hueToRGB(m1, m2, h + 0.33333) * 255,
          hueToRGB(m1, m2, h) * 255,
          hueToRGB(m1, m2, h - 0.33333) * 255
        ];
    })(Streets.avg(hsl.h), Streets.avg(hsl.s), Streets.avg(hsl.l));

    var a = (hsl.a && hsl.a.length === 2) ? hsl.a[1] : ('a' in hsl) ? hsl.a : 1;
    return 'rgba(' + _(rgb).map(Math.floor).join(',') + ',' + a + ')';
};

// Convert an HSL object to a hex string.
Streets.hsl2hex = function(hsl) {
    var rgb = (function hsl2rgb(h, s, l) {
        if (!s) return [l * 255, l * 255, l * 255];

        var m1, m2;
        var hueToRGB = function (m1, m2, h) {
            h = (h + 1) % 1;
            if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
            if (h * 2 < 1) return m2;
            if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6;
            return m1;
        };

        m2 = (l <= 0.5) ? l * (s + 1) : l + s - l * s;
        m1 = l * 2 - m2;
        return [
          hueToRGB(m1, m2, h + 0.33333) * 255,
          hueToRGB(m1, m2, h) * 255,
          hueToRGB(m1, m2, h - 0.33333) * 255
        ];
    })(Streets.avg(hsl.h), Streets.avg(hsl.s), Streets.avg(hsl.l));

    var z = (rgb[0] << 16 | rgb[1] << 8 | rgb[2]).toString(16);
    while (z.length < 6) z = '0' + z;
    return z;
};

// Convert an HSL object to a node-blend tintspec string.
Streets.hsl2tint = function(hsl) {
    return _('<%=h[0].toFixed(2)%>x<%=h[1].toFixed(2)%>;' +
        '<%=s[0].toFixed(2)%>x<%=s[1].toFixed(2)%>;' +
        '<%=l[0].toFixed(2)%>x<%=l[1].toFixed(2)%>;' +
        '<%=a[0].toFixed(2)%>x<%=a[1].toFixed(2)%>')
    .template(_(hsl).chain().reduce(function(memo, v, k) {
        if (v && k === 'a') {
            memo[k] = v.length === 1 ? [0,v[0]] : v;
        } else if (v) {
            memo[k] = v.length === 1 ? [v[0],v[0]] : v;
        }
        return memo;
    }, {}).defaults({h:[0,1],s:[0,1],l:[0,1],a:[0,1]}).value());
};

// Directly copied from node-blend.
Streets.rgb2hsl = function(r, g, b){
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var delta = max - min;
    var gamma = max + min;
    var h = 0, s = 0, l = gamma / 2;

    if (delta) {
        s = l > 0.5 ? delta / (2 - gamma) : delta / gamma;
        if (max == r && max != g) h = (g - b) / delta + (g < b ? 6 : 0);
        if (max == g && max != b) h = (b - r) / delta + 2;
        if (max == b && max != r) h = (r - g) / delta + 4;
        h /= 6;
    }

    h = h > 1 ? 1 : h < 0 ? 0 : h;
    s = s > 1 ? 1 : s < 0 ? 0 : s;
    l = l > 1 ? 1 : l < 0 ? 0 : l;
    return [h, s, l];
};

Streets.parseTintString = function(str) {
    if (!str || !str.length) return {};

    var options = {};
    var hex = str.match(/^#?([0-9a-f]{6})$/i);
    if (hex) {
        var hsl = Streets.rgb2hsl(
            parseInt(hex[1].substring(0, 2), 16),
            parseInt(hex[1].substring(2, 4), 16),
            parseInt(hex[1].substring(4, 6), 16)
        );
        options.h = [hsl[0],hsl[0]];
        options.s = [hsl[1],hsl[1]];
        // Map midpoint grey to the color value, stretching values to
        // preserve white/black range. Will preserve good contrast and
        // midtone color at the cost of clipping extreme light/dark values.
        var l = hsl[2];
        var y0,y1;
        if (l > 0.5) {
            y0 = 0;
            y1 = l * 2;
        } else {
            y0 = l - (1-l);
            y1 = 1;
        }
        options.l = [y0,y1];
    } else {
        var parts = str.split(';');
        var split_opt = function(opt) {
            if (opt.indexOf('x') > -1) {
                var pair = opt.split('x');
                return [parseFloat(pair[0]),parseFloat(pair[1])];
            } else {
                var value = parseFloat(opt);
                return [value,value];
            }
        };
        if (parts.length > 0) options.h = split_opt(parts[0]);
        if (parts.length > 1) options.s = split_opt(parts[1]);
        if (parts.length > 2) options.l = split_opt(parts[2]);
        if (parts.length > 3) options.a = split_opt(parts[3]);
    }

    return options;
};

// Wrapper around Streets.parseTintString.
Streets.tint2hsl = function(str) {
    if (!str) return false;

    // Convert a hex string into hsv.
    if (/^[0-9a-f]{6}$/i.test(str)) {
        var hsl = Streets.parseTintString(str);
        // The hex range stretch in parseTintString needs to be
        // undone for the purposes of setting a hex value.
        hsl.l = [Streets.avg(hsl.l),Streets.avg(hsl.l)];
        return hsl;
    }

    // No tint string.
    if (str.indexOf('+') < 0) return false;

    // Tint string.
    return Streets.parseTintString(str.split('+').pop());
};

Streets.avg = function(arr) { return typeof arr === 'number' ? arr : _(arr).reduce(function(sum, v) {
    sum += v;
    return sum;
}, 0) / arr.length; };

Streets.delta = function(arr) { return Math.abs(arr[1] - arr[0]) * 0.5 };

Streets.enabled = function(arr) { return !arr || (arr && arr[1] > 0) ? 1 : 0 };

Streets.inverted = function(arr) { return (arr[1] < arr[0]) ? 1 : 0 };

// Determine whether this configuration is a no-op
// (ie. all layers and background are transparent).
Streets.empty = function(id) {
    return _(Streets.decode(id)).all(function(v,k) {
        if (k === 'bg') return v === '';
        if (!v.h) return true;
        if (v.a[0] <= 0 && v.a[1] <= 0) return true;
        return false;
    });
};

Streets.styles = function(layers, skipalike) {
    function convert(layers) {
        return _(['base.mapbox-streets'].concat(layers)).reduce(function(memo, l) {
            if (!l) return memo;
            var p = l.split('+');
            if (p[0] === 'base.mapbox-streets') {
                var config = Streets.decode(l);
                memo.l10n = config.l10n;
                memo.scale = config.scale;
                memo.bg = Streets.style(config.bg && Streets.parseTintString(config.bg), 'bg');
                memo.streets = Streets.style(config.streets, 'streets');
                memo.landuse = Streets.style(config.landuse, 'landuse');
                memo.buildings = Streets.style(config.buildings, 'buildings');
                memo.water = Streets.style(config.water, 'water');
            } else {
                memo[p[0]] = Streets.style(p[1] && Streets.parseTintString(p[1]), p[0]);
            }
            return memo;
        }, {});
    }
    var styles = convert(layers);

    if (skipalike) return styles;

    _(Streets.recipes).each(function(op, id) {
        var hsl = op.control(styles);
        var type = Streets.type(styles);
        var palette = convert(Streets.styles2layers(op.hsl(hsl, type)));
        var alike = _(styles).chain().omit('l10n','scale').all(function(astyle, l) {
            if (!palette[l]) return false;
            var bstyle = palette[l];
            return _(astyle).all(function(a, key) {
                if (!(key in bstyle)) return false;
                var b = bstyle[key];
                return typeof a === 'number' ? Math.abs(a - b) <= 0.05 : a === b;
            });
        }).value();
        if (alike) {
            styles.whiz = _(hsl).clone();
            styles.whiz.palette = id;
        }
    });
    styles.whiz = styles.whiz || Streets.style(Streets.parseTintString('#73b6e6'));

    return styles;
};

Streets._swatchCache = {};

// Returns a swatch object with the following properties:
// - data: true/false for should display data layers
// - icon: a base.css icon to display for the swatch
// - rgba: the rgba background color to display
Streets.swatch = function(layers) {
    var key = JSON.stringify(layers);
    if (Streets._swatchCache[key]) return Streets._swatchCache[key];
    var data = _(layers).any(function(l) { return l.indexOf('base.') === -1 });
    var styles = Streets.styles(layers);
    var type = Streets.type(styles);
    var icon = ({streets:'street',terrain:'mt', satellite:'satellite'})[type];
    var b = ({streets:'water',terrain:'water',satellite:'streets'})[type];
    var a = ({streets:'bg',terrain:'base.live-land-tr',satellite:'base.live-satellite'})[type];
    a = Streets.style2swatch(styles[a], a);
    b = Streets.style2swatch(styles[b], b);
    var classes = (a.l > 0.5 && a.s < 0.5) || a.a < 0.5 ? 'quiet' : 'dark';
    a = a.a > 0.1 ? Streets.hsl2rgba(a) : '#ddd';
    b = b.a > 0.1 ? Streets.hsl2rgba(b) : '#eee';
    Streets._swatchCache[key] = { type:type, icon:icon, a:a, b:b, data:data, classes:classes };
    return Streets._swatchCache[key];
};

Streets.styles2layers = function(styles) {
    var c = function(v) { return Math.max(0,Math.min(1,v)) };

    // Flag for determining whether all streets layers are turned off.
    var streets = _(styles).chain()
        .pick(['bg','streets','water','buildings','landuse'])
        .any(function(s) { return s.on; })
        .value();

    var hsla = _(styles).reduce(function(memo, s, id) {
        if (id === 'bg') {
            memo[id] = s.on ? Streets.style2hex(s) : '';
        } else if (typeof s === 'object' && 'h' in s) {
            memo[id] = {
                h:[c(s.h-s.hd),c(s.h+s.hd)],
                s:[c(s.s-s.sd),c(s.s+s.sd)],
                l:s.inv ? [c(s.l+s.ld),c(s.l-s.ld)] : [c(s.l-s.ld),c(s.l+s.ld)],
                a:[0,c(s.on?s.a:0)]
            };
        } else {
            memo[id] = s;
        }
        return memo;
    }, {});
    return _(hsla).chain().keys()
        .filter(function(id) { return id.indexOf('base.') !== -1 })
        .sortBy(function(id) {
            if (id === 'base.live-satellite') return -3;
            if (id === 'base.live-land-tr') return -2;
            if (id === 'base.live-landuse-tr') return -1;
            return 0;
        })
        .map(function(id) { return hsla[id] ? id + '+' + Streets.hsl2tint(hsla[id]) : id })
        .value()
        .concat(streets ? ['base.mapbox-streets+' + Streets.encode(hsla)] : []);
};

Streets.style = function make(style, id) {
    style = (id === 'bg') ?
        (style || { h:[0,1], s:[0,1], l:[0,1], a:[0,0] }) :
        (style || { h:[0,1], s:[0,1], l:[0,1], a:[0,1] });
    style.on = style.on || (!style.a || (style.a && style.a[1] > 0));
    style.inv = style.inv || (style.l[0] > style.l[1]);
    style.hd = style.hd || Streets.delta(style.h);
    style.sd = style.sd || Streets.delta(style.s);
    style.ld = style.ld || (id === 'bg' ? 0 : Streets.delta(style.l));

    style.h = Streets.avg(style.h);
    style.s = Streets.avg(style.s);
    style.l = Streets.avg(style.l);
    style.a = !style.a ? 1 : style.a[1];
    return style;
};

Streets.type = function(styles) {
    return styles['base.live-satellite'] ? 'satellite'
        : styles['base.live-land-tr'] ? 'terrain'
        : 'streets';
};

// Swatch is a visualization of what a given layer/style will look like
// post-hsla adjustment. It is based on a hardcoded mapping of the perceived
// "main color" of a given layer as the origin color prior to adjustment.
Streets.style2swatch = function(s, id) {
    var origins = {
        bg:'#e8e0d8',
        streets:'#ffffff',
        landuse:'#c8df9f',
        buildings:'#d5ccc1',
        water:'#73b6e6',
        whiz:'#777777',
        'base.live-land-tr':'#c8df9f',
        'base.live-landuse-tr':'#e8e0d8',
        'base.live-satellite':'#626940',
    };

    if (!origins[id]) return {h:0,s:0,l:0,a:0};

    var orig = Streets.parseTintString(origins[id]);
    orig.h = Streets.avg(orig.h);
    orig.s = Streets.avg(orig.s);
    orig.l = Streets.avg(orig.l);
    orig.a = 1;
    var tinted = {};

    // Convert style to tintspec and ramp each hsla value.
    var c = function(v) { return Math.max(0,Math.min(1,v)) };
    var tintspec = {
        h:[c(s.h-s.hd),c(s.h+s.hd)],
        s:[c(s.s-s.sd),c(s.s+s.sd)],
        l:s.inv ? [c(s.l+s.ld),c(s.l-s.ld)] : [c(s.l-s.ld),c(s.l+s.ld)],
        a:[0,c(s.on?s.a:0)]
    };
    var tinted = _(orig).reduce(function(memo, val, key) {
        memo[key] = tintspec[key][0] + (val*(tintspec[key][1]-tintspec[key][0]));
        return memo;
    }, {});
    return tinted;
};

Streets.style2rgba = function(style) {
    return Streets.hsl2rgba(style);
};

Streets.style2hex = function(style) {
    return Streets.hsl2hex(style);
};

Streets.style2hue = function(style) {
    return Streets.hsl2hex({ h:style.h, s:1, l:0.5 });
};

// Each recipe is an object with
// - name, UI name of the recipe
// - hsl, function that takes an hsl and generates a full styles hash (palette)
// - styles, function that takes a full styles hash and generates a full styles hash (palette)
Streets.recipes = {};
Streets.recipes.streets = (function() {
    var exports = {};
    exports.name = 'Streets';
    exports.swatches = [
        'f5c272',
        'd27591',
        '9c89cc',
        '548cba',
        '63b6e5',
        'b7ddf3'
    ];
    exports.hsl = function(hsl, type) {
        var presets = _({
            'f5c272': 'base.mapbox-streets+bg-c6916b_water-0.10x0.10;0.86x0.86;0.70x0.70;0.00x1.00_streets-0.11x0.11;0.68x0.84;0.01x0.83;0.00x1.00_landuse-0.15x0.35;0.10x0.52;0.28x0.60;0.00x1.00_buildings-0.05x0.05;0.28x0.78;0.07x0.69;0.00x1.00',
            'd27591': 'base.mapbox-streets+bg-975d6e_water-0.94x0.94;0.50x0.50;0.64x0.64;0.00x1.00_streets-0.91x0.91;0.12x0.46;0.78x0.34;0.00x1.00_landuse-0.43x0.63;0.90x0.98;0.04x0.36;0.00x0.44_buildings-0.08x0.08;0.74x1.00;0.38x0.64;0.00x0.37',
            '9c89cc': 'base.mapbox-streets+bg-574152_water-0.71x0.71;0.40x0.40;0.67x0.67;0.00x1.00_streets-0.03x0.03;0.17x0.83;0.86x0.14;0.00x1.00_landuse-0.62x0.82;0.03x0.41;0.05x0.31;0.00x1.00_buildings-0.09x0.09;0.13x1.00;0.41x0.41;0.00x1.00',
            '548cba': 'base.mapbox-streets+bg-bfd8d3_water-0.57x0.57;0.42x0.42;0.53x0.53;0.00x1.00_streets-0.51x0.51;0.18x0.32;0.40x0.92;0.00x1.00_landuse-0.36x0.56;0.05x0.63;0.22x0.92;0.00x1.00_buildings-0.27x0.27;0.00x0.56;0.29x1.00;0.00x1.00',
            '63b6e5': 'base.mapbox-streets+bg-e8e0d8_water-0.57x0.57;0.69x0.69;0.67x0.67;0.00x1.00_streets-0.00x1.00;0.00x1.00;0.00x1.00;0.00x1.00_landuse-0.15x0.35;0.00x1.00;0.00x1.00;0.00x1.00_buildings-0.09x0.09;0.00x0.76;0.00x1.00;0.00x1.00',
            'b7ddf3': 'base.mapbox-streets+bg-ffefd1_water-0.56x0.56;0.71x0.71;0.83x0.83;0.00x1.00_streets-0.00x0.91;0.00x1.00;0.25x1.00;0.00x1.00_landuse-0.12x0.32;0.25x0.93;0.31x0.97;0.00x1.00_buildings-0.11x0.11;0.42x0.92;0.33x0.99;0.00x1.00'
        }).reduce(function(memo, layer, key) {
            memo[key] = Streets.styles(layer.split(','), true);
            return memo;
        }, {});
        var satellite = _({
            'f5c272': 'base.live-satellite+0.00x0.68;0.00x0.44;0.44x1.00;0.00x1.00,base.mapbox-streets+water-0.10x0.10;0.86x0.86;0.70x0.70;0.00x1.00_streets-0.00x1.00;0.00x1.00;0.00x1.00;0.00x1.00',
            'd27591': 'base.live-satellite+0.00x0.46;0.00x0.66;0.09x0.88;0.00x1.00,base.mapbox-streets+water-0.94x0.94;0.50x0.50;0.64x0.64;0.00x1.00_streets-0.00x1.00;0.00x1.00;1.00x0.00;0.00x1.00',
            '9c89cc': 'base.live-satellite+0.35x1.00;0.00x0.37;0.00x0.79;0.00x1.00,base.mapbox-streets+water-0.71x0.71;0.40x0.40;0.67x0.67;0.00x1.00_streets-0.00x1.00;0.00x1.00;1.00x0.00;0.00x1.00',
            '548cba': 'base.live-satellite+0.00x1.00;0.00x1.00;0.00x1.00;0.00x1.00,base.mapbox-streets+water-0.57x0.57;0.42x0.42;0.53x0.53;0.00x1.00_streets-0.00x1.00;0.00x1.00;1.00x0.00;0.00x1.00',
            '63b6e5': 'base.live-satellite+0.00x0.97;0.00x0.72;0.24x1.00;0.00x1.00,base.mapbox-streets+water-0.57x0.57;0.69x0.69;0.67x0.67;0.00x1.00_streets-0.00x1.00;0.00x1.00;1.00x0.00;0.00x1.00',
            'b7ddf3': 'base.live-satellite+0.00x0.94;0.00x0.47;0.44x1.00;0.00x1.00,base.mapbox-streets+water-0.56x0.56;0.71x0.71;0.83x0.83;0.00x1.00_streets-0.00x1.00;0.00x1.00;0.00x1.00;0.00x1.00'
        }).reduce(function(memo, layer, key) {
            memo[key] = Streets.styles(layer.split(','), true);
            return memo;
        }, {});
        function hash(hsl) {
            if (typeof hsl === 'string') hsl = Streets.style(Streets.parseTintString(hsl));
            return (Math.floor(hsl.h * 10) * 1000) +
                (Math.floor(hsl.l * 10) * 100) +
                ((Math.floor(hsl.h * 100) % 10) * 10) +
                ((Math.floor(hsl.l * 100) % 10) * 1);
        }
        var input = hash(hsl);
        var preset = _(_(presets).keys()).reduce(function(memo, key) {
            if (!memo) return key;
            var a = Math.abs(hash(memo) - input);
            var b = Math.abs(hash(key)  - input);
            return b < a ? key : memo;
        }, false);
        if (type === 'satellite') {
            var palette = satellite[preset];
            palette.swatch = preset;
            return palette;
        }
        // No-op.
        var palette;
        if (_(hsl).chain().omit('palette').isEqual(Streets.style()).value()) {
            palette = Streets.styles(['base.mapbox-streets+bg-e8e0d8_water_streets_landuse_buildings'], true);
            preset = '63b6e5';
        } else {
            palette = presets[preset];
        }
        palette['base.live-land-tr'] = _({ld:0.2}).defaults(palette.bg);
        palette['base.live-landuse-tr'] = _({ld:0.2}).defaults(palette.landuse);
        palette.swatch = preset;
        return palette;
    };
    exports.control = function(styles) { return styles.water };
    return exports;
})();
Streets.recipes.basic = (function() {
    var exports = {};
    exports.name = 'Basic';
    exports.hsl = function(hsl, type) {
        var palette = {
            water:     {h:0.23,s:0.50,l:0.75,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false},
            landuse:   {h:0.57,s:0.26,l:0.68,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false},
            buildings: {h:0.08,s:0.26,l:0.80,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false},
            streets:   {h:0.23,s:0.00,l:0.75,a:1,ld:0.5,sd:0.0,hd:0,on:true,inv:false},
            bg:        {h:0.08,s:0.26,l:0.88,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false}
        };
        _(['landuse','buildings','bg']).each(function(k) {
            var hp = (palette[k].h - palette.water.h) * hsl.s;
            var lm = Math.min(0.75 + hsl.l, 1.10);
            var sm = Math.pow(1.00 - hsl.s, 2.00);
            palette[k].h = (hsl.h + hp) % 1;
            palette[k].l = Math.min(1, palette[k].l * lm);
            palette[k].s = Math.min(1, palette[k].s * sm);
        });
        if (type === 'satellite') {
            palette['base.live-satellite'] = {h:hsl.h,s:hsl.s,l:hsl.l,a:1,hd:0.1,sd:0.2,ld:0.2,on:true,inv:false};
            palette.streets.a = 0.8;
            palette.streets.inv = palette['base.live-satellite'].l < 0.75;
            return palette;
        }
        palette.streets.inv = palette.bg.l < 0.75;
        palette.water.h = hsl.h;
        palette.water.s = hsl.s;
        palette.water.l = hsl.l;
        palette['base.live-land-tr'] = _({ld:0.2}).defaults(palette.bg);
        palette['base.live-landuse-tr'] = _({ld:0.2}).defaults(palette.landuse);
        return palette;
    };
    exports.control = function(styles) { return styles.water };
    return exports;
})();
Streets.recipes.accent = (function() {
    var exports = {};
    exports.name = 'Accent';
    exports.hsl = function(hsl, type) {
        var palette = {
            water:     {h:0.57,s:0.26,l:0.68,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false},
            landuse:   {h:0.23,s:0.50,l:0.75,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false},
            buildings: {h:0.08,s:0.26,l:0.80,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false},
            streets:   {h:0.23,s:0.00,l:0.75,a:1,ld:0.5,sd:0.0,hd:0,on:true,inv:false},
            bg:        {h:0.08,s:0.26,l:0.88,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false}
        };
        _(['water','buildings','bg']).each(function(k) {
            var hp = (palette[k].h - palette.landuse.h) * hsl.s;
            var lm = Math.min(0.75 + hsl.l, 1.10);
            var sm = Math.pow(1.00 - hsl.s, 2.00);
            palette[k].h = (hsl.h + hp) % 1;
            palette[k].l = Math.min(1, palette[k].l * lm);
            palette[k].s = Math.min(1, palette[k].s * sm);
        });
        if (type === 'satellite') {
            palette['base.live-satellite'] = _({hd:0.1,sd:0.2,ld:0.2}).defaults(palette.water);
            palette.streets = {h:hsl.h,s:hsl.s,l:hsl.l,a:0.8,ld:0.3,sd:0,hd:0,on:true,inv:palette['base.live-satellite'].l < 0.75};
            return palette;
        }
        palette.streets.inv = palette.bg.l < 0.75;
        palette.landuse.h = hsl.h;
        palette.landuse.s = hsl.s;
        palette.landuse.l = hsl.l;
        palette['base.live-land-tr'] = _({ld:0.2}).defaults(palette.bg);
        palette['base.live-landuse-tr'] = _({ld:0.2}).defaults(palette.landuse);
        return palette;
    };
    exports.control = function(styles) { return styles.landuse };
    return exports;
})();

Streets.recipes.monochrome = (function() {
    var exports = {};
    exports.name = 'Bold';
    exports.hsl = function(hsl, type) {
        var keys = ['water', 'landuse', 'buildings', 'bg', 'streets'];
        var palette = {
            water:     {h:-0.03, s:-0.10, l:-0.25, a:1.0,ld:0.0,sd:0.0,hd:0,on:true,inv:false},
            landuse:   {h:-0.02, s: 0.00, l:-0.10, a:1.0,ld:0.2,sd:0.0,hd:0,on:true,inv:false},
            buildings: {h:-0.01, s: 0.00, l:-0.05, a:1.0,ld:0.2,sd:0.0,hd:0,on:true,inv:false},
            streets:   {h: 0.00, s:-0.50, l: 0.10, a:1.0,ld:0.5,sd:0.2,hd:0,on:true,inv:false},
            bg:        {h: 0.00, s: 0.00, l: 0.00, a:1.0,ld:0.0,sd:0.0,hd:0,on:true,inv:false}
        };
        _(keys).each(function(k, i) {
            _(['h','s','l']).each(function(a) {
                palette[k][a] = palette[k][a] + hsl[a];
                palette[k][a] = Math.max(0, palette[k][a]);
                palette[k][a] = Math.min(1, palette[k][a]);
            });
        });
        palette.streets.inv = palette.bg.l < 0.75;
        palette['base.live-land-tr'] = _({ld:0.2}).defaults(palette.bg);
        palette['base.live-landuse-tr'] = palette.landuse;
        palette['base.live-satellite'] = palette.landuse;
        return palette;
    };
    exports.control = function(styles) { return styles.bg };
    return exports;
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Streets;
} else {
    window.Tablesort = Streets;
}

},{}],39:[function(require,module,exports){
var counter = 0;
module.exports.makeId = function() {
    return 'marker-' + (+new Date()).toString(36) + (counter++).toString(36);
};

},{}],40:[function(require,module,exports){
exports.zoomToggle = function() {
    var view = this; // `this` is the map object
    var zoomIn = $('#zoom-in');
    var zoomOut = $('#zoom-out');
    var max = view.getMaxZoom();
    var min = view.getMinZoom();

    if (view.getZoom() >= max) {
        zoomIn.addClass('disabled');
    } else {
        zoomIn.removeClass('disabled');
    }

    if (view.getZoom() <= min) {
        zoomOut.addClass('disabled');
    } else {
        zoomOut.removeClass('disabled');
    }
};

exports.zoomIn = function(ev) {
    var zoom = this.map.getZoom(),
        max = this.map.getMaxZoom();

    if (zoom <= max) this.map.zoomIn(1);
    return false;
};

exports.zoomOut = function(ev) {
    var zoom = this.map.getZoom(),
        min = this.map.getMinZoom();

    if (zoom >= min) this.map.zoomOut(1);
    return false;
};

},{}],41:[function(require,module,exports){
var simplestylePath = require('./lib/simplestyle'),
    getCenter = require('./lib/getcenter'),
    geojsonHint = require('geojsonhint'),
    util = require('./lib/util'),
    defaults = require('./lib/defaults'),
    fs = require('fs');

var templates = {
    polygon_edit: _("<div class='pin-bottom row1 fill-gray keyline-top'>\n  <div class='pin-bottom row1 js-tabs tabs'><!--\n    --><a href='#poly-edit-text' class='col4 active'>Text</a><!--\n    --><a href='#edit-poly-stroke' class='col4'><!--\n        --><span id='color-stroke' class='color' style='background-color:<%-feature.properties.stroke%>'></span>Stroke</a><!--\n    --><a href='#edit-poly-fill' class='col4'><!--\n        --><span id='color-fill' class='color' style='background-color:<%-feature.properties.fill%>'></span>Fill</a>\n  </div>\n  <div class='pin-right'>\n    <a href='#<%-feature.properties.id%>' class='pad1 quiet icon trash inline round'></a>\n  </div>\n</div>\n\n<div class='clip sliding h active1 col12 row5'>\n  <div id='poly-edit-text' class='animate col12 clearfix row5 pad2'>\n    <div class='space-bottom1'>\n      <input type='text' placeholder='Untitled' class='big stretch' value='<%-feature.properties.title%>' name='title' />\n      <label>Name this polygon</label>\n    </div>\n    <div>\n      <textarea placeholder='Description' class='big stretch js-noTabExit' name='description'><%-feature.properties.description%></textarea>\n      <label>Add a description</label>\n    </div>\n  </div>\n  <div id='edit-poly-stroke' class='animate col12 row5 pad2'>\n    <% print(stroke_template(_({\n        context: 'marker'\n      }).defaults(obj.feature))); %>\n  </div>\n  <div id='edit-poly-fill' class='animate col12 row5 pad2'>\n    <% print(fill_template(_({\n        context: 'marker'\n      }).defaults(obj.feature))); %>\n  </div>\n</div>\n").template(),
    line_edit: _("<div class='pin-bottom row1 fill-gray keyline-top'>\n  <div class='pin-bottom row1 js-tabs tabs'><!--\n    --><a href='#poly-edit-text' class='col6 active'>Text</a><!--\n    --><a href='#edit-poly-stroke' class='col6'><span id='color-stroke' class='color' style='background-color:<%-feature.properties.stroke%>'></span>Stroke</a>\n  </div>\n  <div class='pin-right'>\n    <a href='#<%- feature.properties.id %>' class='pad1 quiet icon trash inline round'></a>\n  </div>\n</div>\n\n<div class='clip sliding h active1 col12 row5'>\n  <div id='poly-edit-text' class='animate col12 clearfix row5 pad2'>\n    <div class='space-bottom1'>\n      <input type='text' placeholder='Untitled' class='big stretch' value='<%- feature.properties.title %>' name='title' />\n      <label>Name this line</label>\n    </div>\n    <div>\n      <textarea placeholder='Description' class='big stretch js-noTabExit' name='description'><%= L.mapbox.sanitize(feature.properties.description) %></textarea>\n      <label>Add a description</label>\n    </div>\n  </div>\n  <div id='edit-poly-stroke' class='animate col12 row5 pad2'>\n    <% print(stroke_template(_({\n        context: 'marker'\n      }).defaults(obj.feature))); %>\n  </div>\n</div>\n").template(),
    marker_tray: _("<a class='truncate strong quiet keyline-bottom block contain small tray-item' id='<%-properties.id%>' href='#edit-<%-properties.id%>'>\n  <%\n    var icon;\n    switch (geometry.type) {\n      case 'Point':\n        icon = 'marker';\n      break;\n      case 'LineString':\n        icon = 'polyline';\n      break;\n      case 'Polygon':\n        icon = 'polygon';\n      break;\n    }\n  %>\n  <span title='<%- icon %>' class='icon <%- icon %> inline quiet'></span>\n  <span class='title pad1y'><%- $('<div>' + L.mapbox.sanitize(properties.title) + '</div>').text() %></span>\n  <span class='icon trash quiet button unround'></span>\n</a>\n").template(),
    marker_edit: _("<div class='pin-bottom fill-gray keyline-top row1'>\n  <div class='pin-bottom row1 js-tabs tabs'><!--\n    --><a href='#marker-edit-text' class='col3 active'>Text</a><!--\n    --><a href='#marker-edit-style' class='col3'>Style</a><!--\n    --><a href='#marker-edit-symbol' class='col3'>Symbol</a><!--\n    --><a href='#marker-edit-coordinates' class='col3'>Lat/Lon</a>\n  </div>\n  <div class='pin-right'>\n    <a href='#<%-feature.properties.id%>' class='pad1 quiet icon trash inline round'></a>\n  </div>\n</div>\n\n<div class='clip sliding h active1 col12 row5'>\n  <div id='marker-edit-text' class='animate col12 clearfix row5 pad2'>\n    <div class='space-bottom1'>\n      <input type='text' placeholder='Untitled' class='small short stretch' value='<%- feature.properties.title %>' name='title' />\n      <label>Name this feature</label>\n    </div>\n    <div>\n      <textarea placeholder='Description' class='small stretch js-noTabExit' name='description'><%= L.mapbox.sanitize(feature.properties.description) %></textarea>\n      <label>Add a description</label>\n    </div>\n  </div>\n  <div id='marker-edit-style' class='animate col12 row5 pad2'>\n    <% print(style_template(_({\n        context: 'marker'\n      }).defaults(feature))); %>\n  </div>\n  <div id='marker-edit-symbol' class='animate col12 row5 pad2'>\n    <% print(symbol_template(_({\n        context: 'marker'\n      }).defaults(feature))); %>\n  </div>\n  <div id='marker-edit-coordinates' class='animate col12 row5 pad2'>\n    <div class='col6'>\n      <fieldset class='with-icon'>\n        <span class='icon u-d-arrow quiet'></span>\n        <input id='latitude' name='latitude' type='number' min='-90' max='90' class='code col12 js-noTabExit'\n            step='any'\n            value=\"<%- feature.geometry.coordinates[1] !== undefined ? feature.geometry.coordinates[1] : 0 %>\" />\n        <label>Latitude</label>\n      </fieldset>\n    </div>\n    <div class='col6'>\n      <fieldset class='with-icon'>\n        <span class='icon l-r-arrow quiet'></span>\n        <input id='longitude' name='longitude' type='number' min='-180' max='180' class='code col12'\n            step='any'\n            value=\"<%- feature.geometry.coordinates[0] !== undefined ? feature.geometry.coordinates[0] : 0 %>\" />\n        <label>Longitude</label>\n      </fieldset>\n    </div>\n  </div>\n</div>\n</div>\n\n").template(),
    stroke: _("<div id='poly-edit-stroke' class='clearfix col12 animate row4'>\n  <div class='small clearfix pad1y space-bottom1'>\n    <div class='style-input-wrapper col4'>\n      <fieldset class='with-icon'>\n        <span class='icon quiet opacity'></span>\n        <input id='stroke-opacity' name='stroke-opacity' type='number' min='0' max='1' step='.1' class='col12 code js-noTabExit' value='<%- obj.properties['stroke-opacity'] || '' %>' />\n\n        <div class='increment increase icon plus keyline-left'></div>\n        <div class='increment decrease icon minus keyline-left keyline-top'></div>\n      </fieldset>\n    </div>\n    <div class='style-input-wrapper col4'>\n      <fieldset class='with-icon'>\n        <span class='icon quiet adjust-stroke'></span>\n        <input id='stroke-width' name='stroke-width' type='number' min='0' max='20' class='code col12' value='<%- obj.properties['stroke-width'] || '' %>' />\n\n        <div class='increment increase icon plus keyline-left'></div>\n        <div class='increment decrease icon minus keyline-left keyline-top'></div>\n      </fieldset>\n    </div>\n    <div class='style-input-wrapper col4'>\n      <input id='stroke' name='stroke' type='text' class='code center col12 color-hex' maxlength='7' placeholder='<%- obj.properties['stroke'] || '' %>' />\n    </div>\n\n  </div>\n  <div class='clearfix clip round'>\n    <% _(App.pigment_colors).each(function(color) { %>\n      <input id='<%- context %>-stroke-<%-color%>' class='label-select' type='radio' data-geojson='stroke.<%- color %>' name='stroke' value='#<%-color%>' <%- obj.properties['stroke'] === '#' + color ? 'checked' : '' %> />\n      <label for='<%- context %>-stroke-<%-color%>' class='dark swatch center clip icon check row1 col1' style='background-color:#<%-color%>'></label>\n    <% }); %>\n  </div>\n</div>\n").template(),
    fill: _("<div id='poly-edit-fill' class='clearfix col12 animate row4'>\n  <div class='small clearfix pad1y space-bottom1'>\n\n    <div class='style-input-wrapper col4'>\n      <fieldset class='clearfix with-icon'>\n        <span class='icon quiet opacity'></span>\n        <input id='fill-opacity' name='fill-opacity' type='number' min='0' max='1' step='.1' class='col12 code js-noTabExit' value='<%- obj.properties['stroke-opacity'] || '' %>' />\n\n        <div class='increment increase icon plus keyline-left'></div>\n        <div class='increment decrease icon minus keyline-left keyline-top'></div>\n      </fieldset>\n    </div>\n    <div class='style-input-wrapper margin4 col4'>\n      <input id='fill' name='fill' type='text' class='code center col12' maxlength='7' placeholder='<%- obj.properties['fill'] || '' %>' />\n    </div>\n\n  </div>\n  <div class='clearfix clip round'>\n    <% _(App.pigment_colors).each(function(color) { %>\n      <input id='<%- context %>-fill-<%-color%>' class='label-select' type='radio' data-geojson='fill.<%- color %>' name='fill' value='#<%-color%>' <%- obj.properties['fill'] === '#' + color ? 'checked' : '' %> />\n      <label for='<%- context %>-fill-<%-color%>' class='dark swatch center clip icon check row1 col1' style='background-color:#<%-color%>'></label>\n    <% }); %>\n  </div>\n</div>\n").template(),
    symbol: _("<div class='pager js-tabs pad1 pill pin-right'>\n  <a href='#marker-edit-symbol-pages' class='col12 quiet full button icon big up round-top quiet'></a>\n  <a href='#marker-edit-symbol-pages' class='col12 quiet full button icon big down round-bottom quiet'></a>\n</div>\n<div id='marker-edit-symbol-pages' class='marker-edit-symbol sliding v active1 clip row4'>\n  <%\n  if (!window.MakiFull) {\n    var icons = window.Maki.slice(0);\n    icons.unshift({ alpha:true, icon:'' });\n    icons = icons.concat(_(10).chain().range().map(function(v) { return { alpha:true, icon:v } }).value());\n    icons = icons.concat(_(26).chain().range().map(function(v) { return { alpha:true, icon:String.fromCharCode(97 + v) } }).value());\n    window.MakiFull = icons;\n  }\n  _(window.MakiFull).chain()\n  .filter(function(icon) { return !icon.tags || icon.tags.indexOf('deprecated') === -1 })\n  .groupBy(function(icon, i) {\n    return Math.floor(i/60);\n  })\n  .each(function(group, i) { %>\n    <div class='animate col12 clearfix row5'>\n    <% _(group).each(function(icon) { %>\n        <input id='<%- context %>-marker-symbol-<%-icon.icon%>' class='label-select' data-geojson='marker-symbol.<%- icon.icon %>' type='radio' name='marker-symbol' value='<%-icon.icon%>' <%- obj['marker-symbol'] === icon.icon ? 'checked' : '' %> />\n      <% if (icon.alpha) { %>\n      <label for='<%- context %>-marker-symbol-<%-icon.icon%>' class='col1 symbol center round'><span class='maki-icon strong alpha'><%-icon.icon%></span></label>\n      <% } else { %>\n      <label for='<%- context %>-marker-symbol-<%-icon.icon%>' class='col1 symbol center round' title='<%-icon.name%>'><span class='maki-icon <%-icon.icon%>'></span></label>\n      <% } %>\n    <% }); %>\n  </div>\n  <% }); %>\n</div>\n").template(),
    style: _("<div class='clearfix space-bottom js-tabs pill'><!--\n--><input id='<%- context %>-marker-size-small' class='label-select' data-geojson='marker-size.small' type='radio' name='marker-size' value='small' <%- obj.properties['marker-size'] === 'small' ? 'checked' : '' %> /><!--\n--><label for='<%- context %>-marker-size-small' class='col3 button'>Small</label><!--\n--><input id='<%- context %>-marker-size-medium' class='label-select' data-geojson='marker-size.medium' type='radio' name='marker-size' value='medium' <%- obj.properties['marker-size'] === 'medium' ? 'checked' : '' %> /><!--\n--><label for='<%- context %>-marker-size-medium' class='col3 button'>Medium</label><!--\n--><input id='<%- context %>-marker-size-large' class='label-select' data-geojson='marker-size.large' type='radio' name='marker-size' value='large' <%- obj.properties['marker-size'] === 'large' ? 'checked' : '' %> /><!--\n--><label for='<%- context %>-marker-size-large' class='col3 button'>Large</label>\n  <div class='col3 row1 style-input-wrapper'>\n    <input id='marker-color' name='marker-color' type='text' class='small center code col12 row1 js-noTabExit color-hex' maxlength='7' style=\"padding: 10px 5px;\" placeholder=\"<%- obj.properties['marker-color'] ? obj.properties['marker-color'] : '#7d7d7d' %>\" />\n  </div>\n</div>\n<div class='clearfix clip round'>\n  <% _(App.colors).each(function(color) { %>\n  <input id='<%- context %>-marker-color-<%-color%>' class='label-select' type='radio' data-geojson='marker-color.<%- color %>' name='marker-color' value='#<%-color%>' <%- obj.properties['marker-color'] === '#' + color ? 'checked' : '' %> />\n  <label for='<%- context %>-marker-color-<%-color%>' class='dark swatch center clip icon check row1 col1' style='background-color:#<%-color%>'></label>\n  <% }); %>\n</div>\n").template()
};

/*
 * API
 *
 * .addFeature: add a GeoJSON feature to the layer
 * .syncUI: make the markers try match features in the layer
 * .enforceDefaults: ensure that a layer has properties, an id, and order
 */
module.exports = function(App, editor) {
    var exports = _({}).extend(Backbone.Events);
    var halo;

    exports.layer = null;
    exports.model = null;
    exports.editing = null;

    exports.onhashchange = function() {
        if (window.location.hash === '#app') exports.clear();
    };

    exports.addFeature = function(feature) {
        exports.layer.addData(feature);
        return feature;
    };

    function removeHighlight() {
        if (editor.map.hasLayer(halo)) editor.map.removeLayer(halo);
    }

    exports.highlightFeature = function(feature) {
        removeHighlight();
        if (feature.geometry.type == 'Point') {
            var coords = feature.geometry.coordinates;
            halo = L.circleMarker([coords[1], coords[0]], {
                radius: 30,
                className: 'marker-highlight'
            });
            editor.map.addLayer(halo);
        }
    };

    exports.enforceDefaults = function(feature) {
        feature.properties = feature.properties || {};
        feature.properties.title = feature.properties.title || '';
        feature.properties.description = feature.properties.description || '';
        feature.properties.id = feature.properties.id || util.makeId();

        var nextOrder = exports.geojson().features.length + 1;
        feature.properties.__order__ = nextOrder;
        return feature;
    };

    // Initialize a fully-new feature, including properties and default styles.
    exports.initializeFeature = function(feature) {
        feature = exports.enforceDefaults(feature);
        feature.properties = _.defaults(feature.properties, defaults[feature.geometry.type]);
        return feature;
    };

    // `silent` can be set to redraw the UI without signaling a change of
    // the Save UI, as used when the page initially loads.
    exports.syncUI = function(silent) {
        var $tray = $('#marker-tray'),
            $items = $tray.find('.tray-item'),
            map = idMap(),
            ids = _.keys(map),
            dirty = false;
        $('#features-tab').text((ids.length > 1 ? ids.length : '') + ' features');
        $items.map(function(idx) {
            var id = $(this).attr('id');
            if (!map[id]) {
                $(this).remove();
                dirty = true;
            } else {
                var title = map[id].toGeoJSON().properties.title;
                title = (typeof title === 'string') ?
                    title.replace(/<[^<]+>/g, '').trim() :
                    title.toString();

                $(this).find('.title').text(title);
                ids = _.without(ids, id);
            }
        });
        ids.forEach(function(id) {
            $tray.append(templates.marker_tray(map[id].toGeoJSON()));
            dirty = true;
        });
        $tray.sortable('destroy').sortable();
        if (dirty && !silent) editor.changed();
        // Enforce DOM emptiness for empty state selectors.
        if (!$('#marker-tray .tray-item').size()) $('#marker-tray').empty();
    };

    var _id = 0;

    exports.concat = function(data) {
        data.features
            .filter(isValid)
            .map(exports.initializeFeature)
            .map(exports.addFeature)
            .map(function(feature) {
                exports.refresh(feature.properties.id, true);
            });
        exports.syncUI();
        exports.fitFeatures();
        analytics.track('Concatenated Markers');

        function isValid(f) {
            var hints = geojsonHint.hint(JSON.stringify(f));
            if (hints.length) return false;
            return (f.geometry &&
                (f.geometry.type == 'Polygon' ||
                f.geometry.type == 'Point' ||
                f.geometry.type == 'LineString'));
        }
    };

    exports.setAll = function(data) {
        exports.layer.clearLayers();
        exports.concat(data);
    };

    exports.fitFeatures = function() {
        var bounds = exports.layer.getBounds();
        if (bounds.isValid()) editor.map.fitBounds(bounds, {
            paddingTopLeft: [0, 240],
            paddingBottomRight: [0, 40]
        });
    };

    // Clear active editing state.
    exports.clear = function() {
        if (exports.layer) exports.layer.eachLayer(disableLayer);
        $('#marker-edit').empty();
        removeHighlight();
        delete exports.editing;
    };

    // Open the editing UI for a marker given id
    exports.edit = function(id, noedit) {
        // Don't re-initialize edit interface when clicking on current marker.
        if (exports.editing && exports.editing.properties.id === id) return;

        // Enable dragging only on active marker
        exports.layer.eachLayer(disableLayer);

        var layer = layerById(id);
        exports.highlightFeature(layer.toGeoJSON());

        var feature = layer.toGeoJSON();
        var props = feature.properties;
        var popup = (props.title || props.description) &&
            L.mapbox.marker.createPopup(feature);

        // Bind popup
        if (popup) {
            layer.bindPopup(popup, { closeButton: false });
        } else {
            layer.closePopup();
        }

        // center if geometry is outside of view
        var geom = (layer.feature.geometry.type == "Point") ? layer._latlng : layer.getBounds();
        if (!editor.map.getBounds().contains(geom)) {
            if (layer.feature.geometry.type == "Point") {
                editor.map.panTo(geom);
            } else {
                editor.map.fitBounds(geom);
            }
        }

        if (!noedit) {
            if (layer instanceof L.Marker) {
                layer._icon.className += ' marker-editing';
                layer.dragging.enable();
            } else {
                layer.editing.enable();
            }
        }
        editor.map.closePopup();
        layer.openPopup(getCenter(layer));
        exports.editing = layer.toGeoJSON();

        var $selectedMarker = $('#' + id);

        var type = layer.toGeoJSON().geometry.type;
        if (type === 'Point') {
            var coords = exports.editing.geometry.coordinates;
            coords = L.latLng(coords[1], coords[0]).wrap();
            exports.editing.geometry.coordinates[0] = coords.lng;
            exports.editing.geometry.coordinates[1] = coords.lat;
            $('#marker-edit').html(templates.marker_edit({
                feature: exports.editing,
                symbol_template: templates.symbol,
                style_template: templates.style
            }));
        } else {
            var template = (type === 'Polygon') ?
                templates.polygon_edit:
                templates.line_edit;
            $('#marker-edit').html(template({
                feature: exports.editing,
                fill_template: templates.fill,
                stroke_template: templates.stroke
            }));
            window.location.hash = '#data';
        }

        exports.trigger('edit', type.toLowerCase(), true);
    };

    // Delete the given marker.
    exports.del = function(id) {
        if (!exports.layer) throw new Error('No layer to edit');

        exports.clear();
        exports.layer.eachLayer(removeLayer);
        exports.model.set('features', exports.layer.toGeoJSON().features);
        exports.syncUI();

        function removeLayer(l) {
            if (l.toGeoJSON().properties.id === id) {
                exports.layer.removeLayer(l);
            }
        }

        exports.trigger('del');
    };

    // Save the markers.
    exports.save = function(callback) {
        if (!exports.model) return callback();
        var features = exports.layer.toGeoJSON().features;
        exports.model.set('features', serializeOrder(features));
        App.save(exports.model, callback);
    };


    exports.geojson = function() {
        return exports.layer.toGeoJSON();
    };

    // Refresh the icon, popup on a given feature to show a live preview
    // while editing
    //
    // `silent` means that this is part of a large group of features
    exports.refresh = function(id, silent) {
        var l = layerById(id),
            feature = l.toGeoJSON();

        // Set editing class + set the new default marker template.
        if (exports.editing && exports.editing.properties.id === id) {
            if (l instanceof L.Marker) {
                l._icon.className += ' marker-editing';
                defaults.Point = _(exports.editing.properties).reduce(function(memo, val, key) {
                    if ((/marker-(color|symbol|size)/).test(key)) memo[key] = val;
                    return memo;
                }, { title:'', description:'' });
                l.setIcon(L.mapbox.marker.icon(feature.properties));
            } else {
                defaults[feature.geometry.type] = _(exports.editing.properties).reduce(function(memo, val, key) {
                    if ((/stroke/).test(key)) memo[key] = val;
                    if ((/fill/).test(key)) memo[key] = val;
                    return memo;
                }, { title:'', description:'' });
                l.setStyle(simplestylePath(feature));
            }
        }

        // Refresh popup, disable fading for re-rendering.
        var fade = editor.map.options.fadeAnimation;
        if (l._popup) editor.map.options.fadeAnimation = false;

        var props = feature.properties;
        var popup = (props.title || props.description) &&
            L.mapbox.marker.createPopup(feature);

        if (popup) {
            l.unbindPopup();
            l.bindPopup(popup, { closeButton: false });
            if (!silent) l.openPopup(getCenter(l));
        } else {
            l.closePopup();
            l.unbindPopup();
        }

        // Update color swatches in vtabs
        $('#color-stroke').css('background',props.stroke);
        $('#color-fill').css('background',props.fill);

        editor.map.options.fadeAnimation = fade;
    };

    // Initialize.
    // Skip fetch if map is new -- there are no prior markers made.
    var fetch = !editor.model.get('new') ? App.fetch : function(url,cb) { return cb(); };

    fetch('/api/Markers/' + editor.model.id, markersLoaded);

    function markersLoaded(err, model) {
        if (err && err.status !== 404) return Views.modal.show('err', err);
        if (!model) {
            exports.model = new Backbone.Model({ id: editor.model.id, features: [] });
            exports.model.url = App.api + '/api/Markers/' + editor.model.id;
        } else {
            exports.model = model;
        }

        exports.layer = new L.geoJson(null, {
            pointToLayer: pointToLayer,
            style: simplestylePath
        }).addTo(editor.map)
            .on('layeradd', augmentLayer)
            .on('click', layerClick);

        function pointToLayer(feature, latlon) {
            if (!feature.properties) feature.properties = {};
            return L.mapbox.marker.style(feature, latlon);
        }

        exports.layer.addData(assignOrder(exports.model.toJSON()));

        $('#marker-tray')
            .sortable()
            .bind('sortupdate', onSortUpdate);

        exports.syncUI(true);

        // @TODO done currently to set dragging to disabled on init.
        exports.clear();

        // needed here because the project_info template is rendered before markers are initialized
        if (exports.layer.toGeoJSON().features.length) $('#downloads').show();

        function augmentLayer(e) {
            var l = e.layer;
            l.on('dragstart', removeHighlight)
                .on('dragend', onfeatureedit)
                .on('edit', onfeatureedit)
                .on('move', onfeatureedit);
            // if for multipolygon error, need to investigate
            if (l.options) l.options.draggable = true;
        }

        function onfeatureedit(e) {
            var feature = e.target.toGeoJSON();
            exports.highlightFeature(feature);
            exports.model.set('features', exports.layer.toGeoJSON());
            if (e.type == 'dragend') {
                $('#latitude').val(feature.geometry.coordinates[1]);
                $('#longitude').val(feature.geometry.coordinates[0]);
            }
            editor.changed();
        }
    }

    function assignOrder(f) {
        for (var i = 0; i < f.features.length; i++) {
            if (!f.features[i].properties) {
                f.features[i].properties = {};
                f.features[i].properties.id = 'marker-' + (+new Date()).toString(36);
            }
            f.features[i].properties.__order__ = i;
        }
        return f;
    }

    function panToLayer(map, feature) {
        var zoomLevel;
        if (feature instanceof L.Marker) {
            map.setView(feature.getLatLng());
        } else if ('getBounds' in feature && feature.getBounds().isValid()) {
            map.fitBounds(feature.getBounds(), {
                paddingTopLeft: [0, 240],
                paddingBottomRight: [0, 40]
            });
        }
    }

    function layerClick(e) {
        if (App.canedit) {
            exports.edit(e.layer.toGeoJSON().properties.id);
            window.location.hash = '#data';
        }
    }

    function onSortUpdate(ev, ui) {
        var map = idMap();
        $('#marker-tray a').each(function(idx) {
            map[$(this).attr('id')].toGeoJSON().properties.__order__ = idx;
        });
        editor.changed();
    }

    function disableLayer(l) {
        if (l instanceof L.Marker) {
            l._icon.className = l._icon.className.replace(/ marker-editing/g, '');
            l.dragging.disable();
            l.closePopup();
        } else {
            // multipolygons don't like this, need a way of handling them
            if (l.editing) l.editing.disable();
        }
    }

    function idMap() {
        var m = {};
        exports.layer.eachLayer(function(l) {
            m[l.toGeoJSON().properties.id] = l;
        });
        return m;
    }

    function layerById(id) {
        return idMap()[id];
    }

    exports.layerById = layerById;

    return exports;
};

function serializeOrder(features) {
    return features
        .sort(sortByOrder)
        .map(removeOrder);
}

function sortByOrder(a, b) {
    return a.properties.__order__ - b.properties.__order__;
}

function removeOrder(feat) {
    var cloned = _.clone(feat);
    cloned.properties = _.clone(cloned.properties);
    delete cloned.properties.__order__;
    return cloned;
}

},{"./lib/defaults":30,"./lib/getcenter":33,"./lib/simplestyle":37,"./lib/util":39,"fs":2,"geojsonhint":19}],42:[function(require,module,exports){
var fs = require('fs');

var templates = {
    style_presets: _("<%\nvar api = L.mapbox.config.HTTPS_URL;\nvar token = L.mapbox.accessToken;\nvar styles = obj.styles;\n%>\n<div class='clearfix mobile-cols'><!--\n  <% _(styles).each(function(name, mapid) { %>\n  --><input id='style-preset-<%-mapid.replace('.','-')%>' name='style-preset' type='radio' value='<%-mapid%>' class='label-select' /><!--\n  --><label for='style-preset-<%-mapid.replace('.','-')%>' class='col4 pad0x round style-preset contain space-bottom0'>\n    <% if (mapid) { %>\n    <span class='js-style-preset round row1 fill-grey block' style='background-size:cover; background-image:url(\"<%=api%>/<%-mapid%>/auto/240x120.png?access_token=<%-token%>\");'></span>\n    <% } else { %>\n    <span class='js-style-preset round row1 fill-grey block' style='background-repeat:both; background-image:url(\"/editor/img/canvas.png\");'></span>\n    <% } %>\n    <div class='hidden block-in-checked pin-top row1 center pad1'>\n      <span class='inline icon check dot dark fill-darken3'></span>\n    </div>\n    <span class='micro block truncate center'><%-name%></span>\n  </label><!--\n  <% }); %>\n  -->\n</div>\n").template()
};

module.exports = function(App, editor) {
    var exports = {};

    // @TODO load these from the API or not?
    var styles = {
      'mapbox.streets': 'Streets',
      'mapbox.light': 'Light',
      'mapbox.dark': 'Dark',
      'mapbox.satellite': 'Satellite',
      'mapbox.streets-satellite': 'Satellite Streets',
      'mapbox.wheatpaste': 'Wheatpaste',
      'mapbox.streets-basic': 'Streets Classic',
      'mapbox.comic': 'Comic!',
      'mapbox.outdoors': 'Outdoors',
      'mapbox.run-bike-hike': 'Run, Bike, and Hike',
      'mapbox.pencil': 'Pencil',
      'mapbox.pirates': 'Pirates',
      'mapbox.emerald': 'Emerald',
      'mapbox.high-contrast': 'High Contrast',
      '': 'Transparent'
    };

    // Refresh the current map layer to reflect style changes.
    exports.set = function(baselayer) {
        var plus = _(editor.model.get('layers')).filter(function(id) {
            return !(/^(mapbox|base)\./).test(id);
        });
        var layers = (baselayer ? [baselayer] : []).concat(plus);
        if (_(editor.model.get('layers')).isEqual(layers)) return;
        editor.model.set({layers:layers});
    };

    // Template style presets.
    exports.make = function() {
        $('#style-presets').html(templates.style_presets({styles:styles}));
        $('#style-presets #style-preset-' + exports.baselayer.replace('.','-')).prop('checked', true);
    };

    // Init sequence.
    exports.baselayer = styles[editor.model.get('layers')[0]] ? editor.model.get('layers')[0] : '';
    exports.make();
    return exports;
};


},{"fs":2}]},{},[1])