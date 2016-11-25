var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var view = require('./view');
var $ = view.$;
var AwesomePanelView = (function (_super) {
    __extends(AwesomePanelView, _super);
    function AwesomePanelView() {
        _super.apply(this, arguments);
    }
    AwesomePanelView.content = function () {
        var _this = this;
        return this.div({ class: 'awesome' }, function () { return _this.div({ class: 'dude', outlet: 'something' }); });
    };
    AwesomePanelView.prototype.init = function () {
        this.something.html('<div>tada</div>');
    };
    return AwesomePanelView;
})(view.View);
exports.AwesomePanelView = AwesomePanelView;
exports.panelView;
exports.panel;
function attach() {
    exports.panelView = new AwesomePanelView({});
    exports.panel = atom.workspace.addModalPanel({ item: exports.panelView, priority: 1000, visible: false });
    /*setInterval(() => {
        panel.isVisible() ? panel.hide() : panel.show();
        console.log('called');
    }, 1000);*/
}
exports.attach = attach;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2xpYi9tYWluL2F0b20vdmlld3MvYXdlc29tZVBhbmVsVmlldy50cyIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2xpYi9tYWluL2F0b20vdmlld3MvYXdlc29tZVBhbmVsVmlldy50cyJdLCJuYW1lcyI6WyJBd2Vzb21lUGFuZWxWaWV3IiwiQXdlc29tZVBhbmVsVmlldy5jb25zdHJ1Y3RvciIsIkF3ZXNvbWVQYW5lbFZpZXcuY29udGVudCIsIkF3ZXNvbWVQYW5lbFZpZXcuaW5pdCIsImF0dGFjaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBTyxJQUFJLFdBQVcsUUFBUSxDQUFDLENBQUM7QUFDaEMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUVmLElBQWEsZ0JBQWdCO0lBQVNBLFVBQXpCQSxnQkFBZ0JBLFVBQXVCQTtJQUFwREEsU0FBYUEsZ0JBQWdCQTtRQUFTQyw4QkFBY0E7SUFZcERBLENBQUNBO0lBVFVELHdCQUFPQSxHQUFkQTtRQUFBRSxpQkFJQ0E7UUFIR0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsS0FBS0EsRUFBRUEsU0FBU0EsRUFBRUEsRUFDaENBLGNBQU1BLE9BQUFBLEtBQUlBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEtBQUtBLEVBQUVBLE1BQU1BLEVBQUVBLE1BQU1BLEVBQUVBLFdBQVdBLEVBQUVBLENBQUNBLEVBQWhEQSxDQUFnREEsQ0FDckRBLENBQUNBO0lBQ1ZBLENBQUNBO0lBRURGLCtCQUFJQSxHQUFKQTtRQUNJRyxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxpQkFBaUJBLENBQUNBLENBQUNBO0lBQzNDQSxDQUFDQTtJQUNMSCx1QkFBQ0E7QUFBREEsQ0FBQ0EsQUFaRCxFQUFzQyxJQUFJLENBQUMsSUFBSSxFQVk5QztBQVpZLHdCQUFnQixHQUFoQixnQkFZWixDQUFBO0FBRVUsaUJBQTJCLENBQUM7QUFDNUIsYUFBcUIsQ0FBQztBQUNqQyxTQUFnQixNQUFNO0lBQ2xCSSxpQkFBU0EsR0FBR0EsSUFBSUEsZ0JBQWdCQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtJQUNyQ0EsYUFBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsaUJBQVNBLEVBQUVBLFFBQVFBLEVBQUVBLElBQUlBLEVBQUVBLE9BQU9BLEVBQUVBLEtBQUtBLEVBQUVBLENBQUNBLENBQUNBO0lBRTFGQTs7O2VBR1dBO0FBRWZBLENBQUNBO0FBVGUsY0FBTSxHQUFOLE1BU2YsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB2aWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG52YXIgJCA9IHZpZXcuJDtcblxuZXhwb3J0IGNsYXNzIEF3ZXNvbWVQYW5lbFZpZXcgZXh0ZW5kcyB2aWV3LlZpZXc8YW55PiB7XG5cbiAgICBwcml2YXRlIHNvbWV0aGluZzogSlF1ZXJ5O1xuICAgIHN0YXRpYyBjb250ZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXYoeyBjbGFzczogJ2F3ZXNvbWUnIH0sXG4gICAgICAgICAgICAoKSA9PiB0aGlzLmRpdih7IGNsYXNzOiAnZHVkZScsIG91dGxldDogJ3NvbWV0aGluZycgfSlcbiAgICAgICAgICAgICk7XG4gICAgfVxuXG4gICAgaW5pdCgpIHtcbiAgICAgICAgdGhpcy5zb21ldGhpbmcuaHRtbCgnPGRpdj50YWRhPC9kaXY+Jyk7XG4gICAgfVxufVxuXG5leHBvcnQgdmFyIHBhbmVsVmlldzogQXdlc29tZVBhbmVsVmlldztcbmV4cG9ydCB2YXIgcGFuZWw6IEF0b21Db3JlLlBhbmVsO1xuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaCgpIHtcbiAgICBwYW5lbFZpZXcgPSBuZXcgQXdlc29tZVBhbmVsVmlldyh7fSk7XG4gICAgcGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHsgaXRlbTogcGFuZWxWaWV3LCBwcmlvcml0eTogMTAwMCwgdmlzaWJsZTogZmFsc2UgfSk7XG5cbiAgICAvKnNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgcGFuZWwuaXNWaXNpYmxlKCkgPyBwYW5lbC5oaWRlKCkgOiBwYW5lbC5zaG93KCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdjYWxsZWQnKTtcbiAgICB9LCAxMDAwKTsqL1xuXG59XG4iXX0=