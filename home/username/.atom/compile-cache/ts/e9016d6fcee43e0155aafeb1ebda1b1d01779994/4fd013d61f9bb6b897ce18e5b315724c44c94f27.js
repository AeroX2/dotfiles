var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var sp = require("atom-space-pen-views");
var View = (function (_super) {
    __extends(View, _super);
    function View(options) {
        _super.call(this);
        this.options = options;
        this.init();
    }
    Object.defineProperty(View.prototype, "$", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    View.content = function () {
        throw new Error('Must override the base View static content member');
    };
    View.prototype.init = function () {
    };
    return View;
})(sp.View);
exports.View = View;
exports.$ = sp.$;
var ScrollView = (function (_super) {
    __extends(ScrollView, _super);
    function ScrollView(options) {
        _super.call(this);
        this.options = options;
        this.init();
    }
    Object.defineProperty(ScrollView.prototype, "$", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    ScrollView.content = function () {
        throw new Error('Must override the base View static content member');
    };
    ScrollView.prototype.init = function () {
    };
    return ScrollView;
})(sp.ScrollView);
exports.ScrollView = ScrollView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2xpYi9tYWluL2F0b20vdmlld3Mvdmlldy50cyIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2xpYi9tYWluL2F0b20vdmlld3Mvdmlldy50cyJdLCJuYW1lcyI6WyJWaWV3IiwiVmlldy5jb25zdHJ1Y3RvciIsIlZpZXcuJCIsIlZpZXcuY29udGVudCIsIlZpZXcuaW5pdCIsIlNjcm9sbFZpZXciLCJTY3JvbGxWaWV3LmNvbnN0cnVjdG9yIiwiU2Nyb2xsVmlldy4kIiwiU2Nyb2xsVmlldy5jb250ZW50IiwiU2Nyb2xsVmlldy5pbml0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQSxJQUFPLEVBQUUsV0FBVyxzQkFBc0IsQ0FBQyxDQUFDO0FBRTVDLElBQWEsSUFBSTtJQUFrQkEsVUFBdEJBLElBQUlBLFVBQXlCQTtJQVN0Q0EsU0FUU0EsSUFBSUEsQ0FTTUEsT0FBZ0JBO1FBQy9CQyxpQkFBT0EsQ0FBQ0E7UUFET0EsWUFBT0EsR0FBUEEsT0FBT0EsQ0FBU0E7UUFFL0JBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO0lBQ2hCQSxDQUFDQTtJQVhERCxzQkFBSUEsbUJBQUNBO2FBQUxBO1lBQ0lFLE1BQU1BLENBQU1BLElBQUlBLENBQUNBO1FBQ3JCQSxDQUFDQTs7O09BQUFGO0lBRU1BLFlBQU9BLEdBQWRBO1FBQ0lHLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLG1EQUFtREEsQ0FBQ0EsQ0FBQ0E7SUFDekVBLENBQUNBO0lBTURILG1CQUFJQSxHQUFKQTtJQUFTSSxDQUFDQTtJQUNkSixXQUFDQTtBQUFEQSxDQUFDQSxBQWRELEVBQW1DLEVBQUUsQ0FBQyxJQUFJLEVBY3pDO0FBZFksWUFBSSxHQUFKLElBY1osQ0FBQTtBQUVVLFNBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBRXBCLElBQWEsVUFBVTtJQUFrQkssVUFBNUJBLFVBQVVBLFVBQStCQTtJQVNsREEsU0FUU0EsVUFBVUEsQ0FTQUEsT0FBZ0JBO1FBQy9CQyxpQkFBT0EsQ0FBQ0E7UUFET0EsWUFBT0EsR0FBUEEsT0FBT0EsQ0FBU0E7UUFFL0JBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO0lBQ2hCQSxDQUFDQTtJQVhERCxzQkFBSUEseUJBQUNBO2FBQUxBO1lBQ0lFLE1BQU1BLENBQU1BLElBQUlBLENBQUNBO1FBQ3JCQSxDQUFDQTs7O09BQUFGO0lBRU1BLGtCQUFPQSxHQUFkQTtRQUNJRyxNQUFNQSxJQUFJQSxLQUFLQSxDQUFDQSxtREFBbURBLENBQUNBLENBQUNBO0lBQ3pFQSxDQUFDQTtJQU1ESCx5QkFBSUEsR0FBSkE7SUFBU0ksQ0FBQ0E7SUFDZEosaUJBQUNBO0FBQURBLENBQUNBLEFBZEQsRUFBeUMsRUFBRSxDQUFDLFVBQVUsRUFjckQ7QUFkWSxrQkFBVSxHQUFWLFVBY1osQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIlxuXG5pbXBvcnQgc3AgPSByZXF1aXJlKFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIik7XG5cbmV4cG9ydCBjbGFzcyBWaWV3PE9wdGlvbnM+IGV4dGVuZHMgc3AuVmlldyB7XG4gICAgZ2V0ICQoKTogSlF1ZXJ5IHtcbiAgICAgICAgcmV0dXJuIDxhbnk+dGhpcztcbiAgICB9XG5cbiAgICBzdGF0aWMgY29udGVudCgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNdXN0IG92ZXJyaWRlIHRoZSBiYXNlIFZpZXcgc3RhdGljIGNvbnRlbnQgbWVtYmVyJyk7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IocHVibGljIG9wdGlvbnM6IE9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuICAgIGluaXQoKSB7IH1cbn1cblxuZXhwb3J0IHZhciAkID0gc3AuJDtcblxuZXhwb3J0IGNsYXNzIFNjcm9sbFZpZXc8T3B0aW9ucz4gZXh0ZW5kcyBzcC5TY3JvbGxWaWV3IHtcbiAgICBnZXQgJCgpOiBKUXVlcnkge1xuICAgICAgICByZXR1cm4gPGFueT50aGlzO1xuICAgIH1cblxuICAgIHN0YXRpYyBjb250ZW50KCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ011c3Qgb3ZlcnJpZGUgdGhlIGJhc2UgVmlldyBzdGF0aWMgY29udGVudCBtZW1iZXInKTtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgb3B0aW9uczogT3B0aW9ucykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG4gICAgaW5pdCgpIHsgfVxufSJdfQ==