!(function (e) {

    var items;

    function isValidPostcode(p) { 
        var postcodeRegEx = /[A-Z]{1,2}[0-9]{1,2} ?[0-9][A-Z]{2}/i; 
        return postcodeRegEx.test(p); 
    }

    function getSubdomain() {
        var parts = window.location.host.split('.');
        return parts[0];
    }

    function getMaindomain() {
        const url = document.createElement('a');
        //  Set href to any path
        url.setAttribute('href', window.location);
        var parts = url.hostname.split('.')
        parts.shift();
        var maindomain = parts.join('.');
        if (url.port != '') maindomain += ':' + url.port;
        return maindomain;
    }

    function isValidLocation(suppliedlocation) {
        suppliedlocation = suppliedlocation.toLowerCase()
        for(var i = 0; i < locations_all.length; i++) {
            var location = locations_all[i].toLowerCase();
            if (suppliedlocation == location) return true;
        }
    }

    function moveToPostcode(postcode) {
        e.ajax({
            url: '/postcode/' + encodeURI(postcode),
            type: "GET",
            data: i,
            dataType: "json",
            success: function (data) {
                if (typeof data['result'] !== 'undefined') {
                    if (data['result'] == 'success') {
                        var shortcode = data['shortcode'];
                        var longitude = data['longitude'];
                        var latitude = data['latitude'];
                        var subdomain = getSubdomain();
                        var zoom = 17;

                        if (subdomain != shortcode) {
                            var fullurl = window.location.protocol + '//' + shortcode + "." + getMaindomain() + "?lat=" + latitude.toString() + "&lng=" + longitude.toString() + "&zoom=" + zoom.toString();
                            window.location = fullurl;
                        } else {
                            $("#searchBox").val("");
                            map.setView(new L.LatLng(latitude, longitude), zoom, 
                            {   'animation': true , 
                                'pan': {
                                    'duration': 2
                                }
                            });    
                        }        
                    }
                }
            },
            error: function () {
                f();
            },
        });
    }

    function performSearch(searchString) {

        if (isValidPostcode(searchString)) {
        }
        else if (isValidLocation(searchString)) {
        }
        else {
            searchString = searchString.toString().toLowerCase();
            items = [];
            for (var i = 0; i < keywords.length; i++) {
                if ((keywords[i].toLowerCase()).includes(searchString)) {
                    items.push(keywords[i]);
                }
            }
            o(false, items);
        }
    }

    function t(t) {
        (E = -1), (k = []), (T = []);
        var s = b.limit;
        if ((t && s++, (w = e("#searchBox")[0].value), "" !== w)) {
            performSearch(w);
        }
    }
    function o(t, items) {
        var o = e("#searchBox").parent();
        e("#resultsDiv").remove(),
            o.append("<div id='resultsDiv' class='result'><ul id='resultList' class='list'></ul><div>"),
            (e("#resultsDiv")[0].style.position = e("#searchBox")[0].style.position),
            (e("#resultsDiv")[0].style.left = parseInt(e("#searchBox")[0].style.left) - 10 + "px"),
            (e("#resultsDiv")[0].style.bottom = e("#searchBox")[0].style.bottom),
            (e("#resultsDiv")[0].style.right = e("#searchBox")[0].style.right),
            (e("#resultsDiv")[0].style.top = parseInt(e("#searchBox")[0].style.top) + 25 + "px"),
            (e("#resultsDiv")[0].style.zIndex = e("#searchBox")[0].style.zIndex);
        var r = items.length,
            l = !1;
        for (var c = 0; r > c; c++) {
            var u = "<li id='listElement" + c + "' class='listResult'>";
            (u += "<span id='listElementContent" + c + "' class='content'>"),
                (u += "<font size='2' color='#333' class='title'>" + items[c] + "</font></span></li>"),
                e("#resultList").append(u),
                e("#listElement" + c).mouseenter(function () {
                    s(this);
                }),
                e("#listElement" + c).mouseleave(function () {
                    i(this);
                }),
                e("#listElement" + c).mousedown(function () {
                    n(this);
                });
        }
        if (t) {
            var p = "prev.png",
                d = "next.png",
                v = "",
                m = "";
            0 === A && ((p = "prev_dis.png"), (v = "disabled")), l || ((d = "next_dis.png"), (m = "disabled"));
            var g = "<div align='right' class='pagingDiv'>" + (A + 1) + " - " + (A + r) + " " + b.foundRecordsMessage + " ";
            (g += "<input id='pagingPrev' type='image' src='../dist/image/" + p + "' width='16' height='16' class='pagingArrow' " + v + ">"),
                (g += "<input id='pagingNext' type='image' src='../dist/image/" + d + "' width='16' height='16' class='pagingArrow' " + m + "></div>"),
                e("#resultsDiv").append(g),
                e("#pagingPrev").mousedown(function () {
                    y();
                }),
                e("#pagingNext").mousedown(function () {
                    h();
                }),
                a();
        }
    }
    function s(t) {
        var o = parseInt(t.id.substr(11));
        o !== E && e("#listElement" + o).toggleClass("mouseover");
    }
    function i(t) {
        var o = parseInt(t.id.substr(11));
        o !== E && e("#listElement" + o).removeClass("mouseover");
    }
    function n(t) {
        var o = parseInt(t.id.substr(11));
        o !== E && (-1 !== E && e("#listElement" + E).removeClass("active"), e("#listElement" + o).removeClass("mouseover"), e("#listElement" + o).addClass("active"), (E = o), p(), 0 === C ? c(E) : r(E));
    }
    function a() {
        void 0 !== B && (map.removeLayer(B), (B = void 0)),
            (B = L.geoJson(T, {
                style: function (e) {
                    return { color: "#D0473B" };
                },
                pointToLayer: function (e, t) {
                    return new L.CircleMarker(t, { radius: 5, fillOpacity: 0.85 });
                },
                onEachFeature: function (e, t) {
                    t.bindPopup(e.properties.popupContent);
                },
            })),
            map.addLayer(B),
            map.fitBounds(B.getBounds());
    }
    function r(e) {
        $("#resultsDiv").remove(),

        keywordSelect(items[e]);
    }
    function l(e) {
        var t = L.geoJson(e, { onEachFeature: function (e, t) {} });
        return t.getBounds();
    }
    function c(e) {
        if ((void 0 !== B && (map.removeLayer(B), (B = void 0)), -1 !== e)) {
            var t = { color: b.drawColor, weight: 5, opacity: 0.65, fill: !1 };
            (B = L.geoJson(k[e].geometry, {
                style: t,
                onEachFeature: function (t, o) {
                    o.bindPopup(k[e].properties.popupContent);
                },
            })),
                map.addLayer(B),
                "Point" === k[e].geometry.type && -1 !== b.pointGeometryZoomLevel ? map.setView([k[e].geometry.coordinates[1], k[e].geometry.coordinates[0]], b.pointGeometryZoomLevel) : map.fitBounds(B.getBounds());
        }
    }
    function u(e) {
        if ((void 0 !== x && (map.removeLayer(x), (x = void 0)), -1 !== e)) {
            var t = { color: b.color, weight: 5, opacity: 0.65, fill: !1 };
            (x = L.geoJson(k[e].geometry, {
                style: t,
                onEachFeature: function (t, o) {
                    o.bindPopup(k[e].properties.popupContent);
                },
            })),
                map.addLayer(x);
        }
    }
    function p() {
        -1 === E ? (e("#searchBox")[0].value = w) : (e("#searchBox")[0].value = items[E]);
    }
    function d() {
        D > 0 && (-1 !== E && e("#listElement" + E).toggleClass("active"), D - 1 > E ? (e("#listElement" + (E + 1)).toggleClass("active"), E++) : (E = -1), p(), -1 !== E && (0 === C ? c(E) : r(E)));
    }
    function v() {
        D > 0 &&
            (-1 !== E && e("#listElement" + E).toggleClass("active"),
            -1 === E ? (e("#listElement" + (D - 1)).toggleClass("active"), (E = D - 1)) : 0 === E ? E-- : (e("#listElement" + (E - 1)).toggleClass("active"), E--),
            p(),
            -1 !== E && (0 === C ? c(E) : r(E)));
    }
    function m() {
        console.log("Reset");
        resetSearch();
        (e("#searchBox")[0].value = ""), (w = ""), (D = 0), (k = []), (E = -1), e("#resultsDiv").remove(), void 0 !== B && (map.removeLayer(B), (B = void 0)), void 0 !== x && (map.removeLayer(x), (x = void 0));
    }
    function g() {
        // Enter pressed or search button clicked
        var value = e("#searchBox")[0].value.toLowerCase();
        if (isValidPostcode(value)) {
            moveToPostcode(value);          
        } else {
            if (isValidLocation(value)) {
                value = value.replace(' ', '');
                if (value != getSubdomain()) {
                    var fullurl = window.location.protocol + '//' + value + "." + getMaindomain();
                    window.location = fullurl;
                }
            }
        }
        // t(b.pagingActive);
    }
    function f() {
        (D = 0), (k = []), (E = -1), e("#resultsDiv").remove(), void 0 !== B && (map.removeLayer(B), (B = void 0));
        var t = e("#searchBox").parent();
        e("#resultsDiv").remove(), t.append("<div id='resultsDiv' class='result'><i>" + w + " " + b.notFoundMessage + " <p><small>" + b.notFoundHint + "</small></i><div>");
    }
    function y() {
        (e("#searchBox")[0].value = w), (A -= b.limit), t(!0), (F = !1), (E = -1);
    }
    function h() {
        (e("#searchBox")[0].value = w), (A += b.limit), t(!0), (F = !1), (E = -1);
    }
    var B,
        x,
        C,
        b = {
            geojsonServiceAddress: "http://yourGeoJsonSearchAddress",
            placeholderMessage: "Postcode, keyword or 'All'",
            searchButtonTitle: "Search",
            clearButtonTitle: "Clear",
            foundRecordsMessage: "showing results.",
            limit: 10,
            notFoundMessage: "not found.",
            notFoundHint: "Make sure your search criteria is correct and try again.",
            drawColor: "blue",
            pointGeometryZoomLevel: -1,
            pagingActive: !0,
        },
        E = -1,
        D = 0,
        w = "",
        k = [],
        T = [],
        A = 0,
        F = !0;
    (e.fn.GeoJsonAutocomplete = function (o) {
        for (var s = Object.keys(o), i = 0; i < s.length; i++) b[s[i]] = o[s[i]];
        e(this).each(function () {
            var o = e(this);
            o.addClass("searchContainer"),
                o.append('<input id="searchBox" class="searchBox" placeholder="' + b.placeholderMessage + '"/>'),
                o.append('<input id="searchButton" class="searchButton" type="submit" value="" title="' + b.searchButtonTitle + '"/>'),
                o.append('<span class="divider"></span>'),
                o.append('<input id="clearButton" class="clearButton" type="submit"  value="" title="' + b.clearButtonTitle + '">'),
                (e("#searchBox")[0].value = ""),
                e("#searchBox").delayKeyup(function (o) {
                    switch (o.keyCode) {
                        case 13:
                            g();
                            break;
                        case 38:
                            v();
                            break;
                        case 40:
                            d();
                            break;
                        case 37:
                        case 39:
                            break;
                        default:
                            e("#searchBox")[0].value.length > 0 ? ((A = 0), t(!1)) : m();
                    }
                }, 300),
                e("#searchBox").focus(function () {
                    void 0 !== e("#resultsDiv")[0] && (e("#resultsDiv")[0].style.visibility = "visible");
                }),
                e("#searchBox").blur(function () {
                    void 0 !== e("#resultsDiv")[0] &&
                        (F
                            ? (e("#resultsDiv")[0].style.visibility = "collapse")
                            : ((F = !0),
                              window.setTimeout(function () {
                                  e("#searchBox").focus();
                              }, 0)));
                }),
                e("#searchButton").click(function () {
                    g();
                }),
                e("#clearButton").click(function () {
                    m();
                });
        });
    }),
        (e.fn.delayKeyup = function (t, o) {
            var s = 0;
            return (
                e(this).keyup(function (e) {
                    13 !== e.keyCode && 38 !== e.keyCode && 40 !== e.keyCode
                        ? (clearTimeout(s),
                          (s = setTimeout(function () {
                              t(e);
                          }, o)))
                        : t(e);
                }),
                e(this)
            );
        });
})(jQuery);
