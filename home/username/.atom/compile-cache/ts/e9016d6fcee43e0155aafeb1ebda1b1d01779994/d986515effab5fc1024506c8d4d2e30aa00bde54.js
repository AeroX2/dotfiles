var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var view = require('./view');
var $ = view.$;
var PlainMessageView = (function (_super) {
    __extends(PlainMessageView, _super);
    function PlainMessageView() {
        _super.apply(this, arguments);
    }
    PlainMessageView.content = function () {
        this.div({
            class: 'plain-message'
        });
    };
    PlainMessageView.prototype.init = function () {
        this.$.html(this.options.message);
        this.$.addClass(this.options.className);
    };
    PlainMessageView.prototype.getSummary = function () {
        return {
            summary: this.options.message,
            rawSummary: true,
            className: this.options.className
        };
    };
    return PlainMessageView;
})(view.View);
exports.PlainMessageView = PlainMessageView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2xpYi9tYWluL2F0b20vdmlld3MvcGxhaW5NZXNzYWdlVmlldy50cyIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2xpYi9tYWluL2F0b20vdmlld3MvcGxhaW5NZXNzYWdlVmlldy50cyJdLCJuYW1lcyI6WyJQbGFpbk1lc3NhZ2VWaWV3IiwiUGxhaW5NZXNzYWdlVmlldy5jb25zdHJ1Y3RvciIsIlBsYWluTWVzc2FnZVZpZXcuY29udGVudCIsIlBsYWluTWVzc2FnZVZpZXcuaW5pdCIsIlBsYWluTWVzc2FnZVZpZXcuZ2V0U3VtbWFyeSJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBTyxJQUFJLFdBQVcsUUFBUSxDQUFDLENBQUM7QUFDaEMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQVNmLElBQWEsZ0JBQWdCO0lBQVNBLFVBQXpCQSxnQkFBZ0JBLFVBQStCQTtJQUE1REEsU0FBYUEsZ0JBQWdCQTtRQUFTQyw4QkFBc0JBO0lBb0I1REEsQ0FBQ0E7SUFsQlVELHdCQUFPQSxHQUFkQTtRQUNJRSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQTtZQUNMQSxLQUFLQSxFQUFFQSxlQUFlQTtTQUN6QkEsQ0FBQ0EsQ0FBQ0E7SUFDUEEsQ0FBQ0E7SUFFREYsK0JBQUlBLEdBQUpBO1FBQ0lHLElBQUlBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1FBQ2xDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtJQUM1Q0EsQ0FBQ0E7SUFFREgscUNBQVVBLEdBQVZBO1FBQ0lJLE1BQU1BLENBQUNBO1lBQ0hBLE9BQU9BLEVBQUVBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BO1lBQzdCQSxVQUFVQSxFQUFFQSxJQUFJQTtZQUNoQkEsU0FBU0EsRUFBRUEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsU0FBU0E7U0FDcENBLENBQUNBO0lBQ05BLENBQUNBO0lBQ0xKLHVCQUFDQTtBQUFEQSxDQUFDQSxBQXBCRCxFQUFzQyxJQUFJLENBQUMsSUFBSSxFQW9COUM7QUFwQlksd0JBQWdCLEdBQWhCLGdCQW9CWixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcbnZhciAkID0gdmlldy4kO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmlld09wdGlvbnMge1xuICAgIC8qKiB5b3VyIG1lc3NhZ2UgdG8gdGhlIHBlb3BsZSAqL1xuICAgIG1lc3NhZ2U6IHN0cmluZztcbiAgICBjbGFzc05hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFBsYWluTWVzc2FnZVZpZXcgZXh0ZW5kcyB2aWV3LlZpZXc8Vmlld09wdGlvbnM+IHtcblxuICAgIHN0YXRpYyBjb250ZW50KCkge1xuICAgICAgICB0aGlzLmRpdih7XG4gICAgICAgICAgICBjbGFzczogJ3BsYWluLW1lc3NhZ2UnXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGluaXQoKSB7XG4gICAgICAgIHRoaXMuJC5odG1sKHRoaXMub3B0aW9ucy5tZXNzYWdlKTtcbiAgICAgICAgdGhpcy4kLmFkZENsYXNzKHRoaXMub3B0aW9ucy5jbGFzc05hbWUpO1xuICAgIH1cblxuICAgIGdldFN1bW1hcnkoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdW1tYXJ5OiB0aGlzLm9wdGlvbnMubWVzc2FnZSxcbiAgICAgICAgICAgIHJhd1N1bW1hcnk6IHRydWUsXG4gICAgICAgICAgICBjbGFzc05hbWU6IHRoaXMub3B0aW9ucy5jbGFzc05hbWVcbiAgICAgICAgfTtcbiAgICB9XG59Il19