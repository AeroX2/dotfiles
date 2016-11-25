var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var atomUtils = require("../atomUtils");
/**
 * https://github.com/atom/atom-space-pen-views
 */
var FileSymbolsView = (function (_super) {
    __extends(FileSymbolsView, _super);
    function FileSymbolsView() {
        _super.apply(this, arguments);
        this.panel = null;
    }
    Object.defineProperty(FileSymbolsView.prototype, "$", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    FileSymbolsView.prototype.setNavBarItems = function (tsItems, filePath) {
        var items = tsItems;
        this.filePath = filePath;
        super.setItems.call(this, items);
    };
    /** override */
    FileSymbolsView.prototype.viewForItem = function (item) {
        return "\n            <li>\n                <div class=\"highlight\">" + (Array(item.indent * 2).join('&nbsp;') + (item.indent ? "\u221F " : '') + item.text) + "</div>\n                <div class=\"pull-right\" style=\"font-weight: bold; color:" + atomUtils.kindToColor(item.kind) + "\">" + item.kind + "</div>\n                <div class=\"clear\"> line: " + (item.position.line + 1) + "</div>\n            </li>\n        ";
    };
    /** override */
    FileSymbolsView.prototype.confirmed = function (item) {
        atom.workspace.open(this.filePath, {
            initialLine: item.position.line,
            initialColumn: item.position.col
        });
        this.hide();
    };
    FileSymbolsView.prototype.getFilterKey = function () {
        return 'text';
    };
    FileSymbolsView.prototype.show = function () {
        this.storeFocusedElement();
        if (!this.panel)
            this.panel = atom.workspace.addModalPanel({ item: this });
        this.panel.show();
        this.focusFilterEditor();
    };
    FileSymbolsView.prototype.hide = function () {
        this.panel.hide();
        this.restoreFocus();
    };
    FileSymbolsView.prototype.cancelled = function () {
        this.hide();
    };
    return FileSymbolsView;
})(sp.SelectListView);
exports.FileSymbolsView = FileSymbolsView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2xpYi9tYWluL2F0b20vdmlld3MvZmlsZVN5bWJvbHNWaWV3LnRzIiwic291cmNlcyI6WyIvaG9tZS9qYW1lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvbGliL21haW4vYXRvbS92aWV3cy9maWxlU3ltYm9sc1ZpZXcudHMiXSwibmFtZXMiOlsiRmlsZVN5bWJvbHNWaWV3IiwiRmlsZVN5bWJvbHNWaWV3LmNvbnN0cnVjdG9yIiwiRmlsZVN5bWJvbHNWaWV3LiQiLCJGaWxlU3ltYm9sc1ZpZXcuc2V0TmF2QmFySXRlbXMiLCJGaWxlU3ltYm9sc1ZpZXcudmlld0Zvckl0ZW0iLCJGaWxlU3ltYm9sc1ZpZXcuY29uZmlybWVkIiwiRmlsZVN5bWJvbHNWaWV3LmdldEZpbHRlcktleSIsIkZpbGVTeW1ib2xzVmlldy5zaG93IiwiRmlsZVN5bWJvbHNWaWV3LmhpZGUiLCJGaWxlU3ltYm9sc1ZpZXcuY2FuY2VsbGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQSxJQUFPLFNBQVMsV0FBVyxjQUFjLENBQUMsQ0FBQztBQU0zQyxBQUhBOztHQUVHO0lBQ1UsZUFBZTtJQUFTQSxVQUF4QkEsZUFBZUEsVUFBMEJBO0lBQXREQSxTQUFhQSxlQUFlQTtRQUFTQyw4QkFBaUJBO1FBdUNsREEsVUFBS0EsR0FBbUJBLElBQUlBLENBQUNBO0lBZ0JqQ0EsQ0FBQ0E7SUFyREdELHNCQUFJQSw4QkFBQ0E7YUFBTEE7WUFDSUUsTUFBTUEsQ0FBTUEsSUFBSUEsQ0FBQ0E7UUFDckJBLENBQUNBOzs7T0FBQUY7SUFHTUEsd0NBQWNBLEdBQXJCQSxVQUFzQkEsT0FBNEJBLEVBQUVBLFFBQVFBO1FBRXhERyxJQUFJQSxLQUFLQSxHQUF3QkEsT0FBT0EsQ0FBQ0E7UUFFekNBLElBQUlBLENBQUNBLFFBQVFBLEdBQUdBLFFBQVFBLENBQUNBO1FBRXpCQSxLQUFLQSxDQUFDQSxRQUFRQSxZQUFDQSxLQUFLQSxDQUFDQSxDQUFBQTtJQUN6QkEsQ0FBQ0E7SUFFREgsZUFBZUE7SUFDZkEscUNBQVdBLEdBQVhBLFVBQVlBLElBQXVCQTtRQUMvQkksTUFBTUEsQ0FBQ0EsbUVBRTJCQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxTQUFTQSxHQUFHQSxFQUFFQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSw0RkFDbERBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFdBQU1BLElBQUlBLENBQUNBLElBQUlBLDZEQUM3RUEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0EseUNBRXpEQSxDQUFDQTtJQUNOQSxDQUFDQTtJQUVESixlQUFlQTtJQUNmQSxtQ0FBU0EsR0FBVEEsVUFBVUEsSUFBdUJBO1FBQzdCSyxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxFQUFFQTtZQUMvQkEsV0FBV0EsRUFBRUEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUE7WUFDL0JBLGFBQWFBLEVBQUVBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBO1NBQ25DQSxDQUFDQSxDQUFDQTtRQUVIQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtJQUNoQkEsQ0FBQ0E7SUFFREwsc0NBQVlBLEdBQVpBO1FBQWlCTSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQTtJQUFDQSxDQUFDQTtJQUdqQ04sOEJBQUlBLEdBQUpBO1FBQ0lPLElBQUlBLENBQUNBLG1CQUFtQkEsRUFBRUEsQ0FBQ0E7UUFDM0JBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBO1lBQUNBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLGFBQWFBLENBQUNBLEVBQUVBLElBQUlBLEVBQUVBLElBQUlBLEVBQUVBLENBQUNBLENBQUNBO1FBQzNFQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFBQTtRQUVqQkEsSUFBSUEsQ0FBQ0EsaUJBQWlCQSxFQUFFQSxDQUFDQTtJQUM3QkEsQ0FBQ0E7SUFDRFAsOEJBQUlBLEdBQUpBO1FBQ0lRLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO1FBQ2xCQSxJQUFJQSxDQUFDQSxZQUFZQSxFQUFFQSxDQUFDQTtJQUN4QkEsQ0FBQ0E7SUFFRFIsbUNBQVNBLEdBQVRBO1FBQ0lTLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO0lBQ2hCQSxDQUFDQTtJQUNMVCxzQkFBQ0E7QUFBREEsQ0FBQ0EsQUF2REQsRUFBcUMsRUFBRSxDQUFDLGNBQWMsRUF1RHJEO0FBdkRZLHVCQUFlLEdBQWYsZUF1RFosQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzcCA9IHJlcXVpcmUoJ2F0b20tc3BhY2UtcGVuLXZpZXdzJyk7XG5pbXBvcnQgbWFpblBhbmVsVmlldyA9IHJlcXVpcmUoJy4vbWFpblBhbmVsVmlldycpO1xuaW1wb3J0IGF0b21VdGlscyA9IHJlcXVpcmUoXCIuLi9hdG9tVXRpbHNcIik7XG5cblxuLyoqIFxuICogaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXRvbS1zcGFjZS1wZW4tdmlld3NcbiAqL1xuZXhwb3J0IGNsYXNzIEZpbGVTeW1ib2xzVmlldyBleHRlbmRzIHNwLlNlbGVjdExpc3RWaWV3IHtcblxuICAgIGdldCAkKCk6IEpRdWVyeSB7XG4gICAgICAgIHJldHVybiA8YW55PnRoaXM7XG4gICAgfVxuXG4gICAgcHVibGljIGZpbGVQYXRoOiBzdHJpbmc7XG4gICAgcHVibGljIHNldE5hdkJhckl0ZW1zKHRzSXRlbXM6IE5hdmlnYXRpb25CYXJJdGVtW10sIGZpbGVQYXRoKSB7XG5cbiAgICAgICAgdmFyIGl0ZW1zOiBOYXZpZ2F0aW9uQmFySXRlbVtdID0gdHNJdGVtcztcblxuICAgICAgICB0aGlzLmZpbGVQYXRoID0gZmlsZVBhdGg7XG5cbiAgICAgICAgc3VwZXIuc2V0SXRlbXMoaXRlbXMpXG4gICAgfVxuXG4gICAgLyoqIG92ZXJyaWRlICovXG4gICAgdmlld0Zvckl0ZW0oaXRlbTogTmF2aWdhdGlvbkJhckl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaGlnaGxpZ2h0XCI+JHsgQXJyYXkoaXRlbS5pbmRlbnQgKiAyKS5qb2luKCcmbmJzcDsnKSArIChpdGVtLmluZGVudCA/IFwiXFx1MjIxRiBcIiA6ICcnKSArIGl0ZW0udGV4dH08L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicHVsbC1yaWdodFwiIHN0eWxlPVwiZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiR7YXRvbVV0aWxzLmtpbmRUb0NvbG9yKGl0ZW0ua2luZCkgfVwiPiR7aXRlbS5raW5kfTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjbGVhclwiPiBsaW5lOiAke2l0ZW0ucG9zaXRpb24ubGluZSArIDF9PC9kaXY+XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICBgO1xuICAgIH1cbiAgICBcbiAgICAvKiogb3ZlcnJpZGUgKi9cbiAgICBjb25maXJtZWQoaXRlbTogTmF2aWdhdGlvbkJhckl0ZW0pIHtcbiAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3Blbih0aGlzLmZpbGVQYXRoLCB7XG4gICAgICAgICAgICBpbml0aWFsTGluZTogaXRlbS5wb3NpdGlvbi5saW5lLFxuICAgICAgICAgICAgaW5pdGlhbENvbHVtbjogaXRlbS5wb3NpdGlvbi5jb2xcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgfVxuXG4gICAgZ2V0RmlsdGVyS2V5KCkgeyByZXR1cm4gJ3RleHQnOyB9XG5cbiAgICBwYW5lbDogQXRvbUNvcmUuUGFuZWwgPSBudWxsO1xuICAgIHNob3coKSB7XG4gICAgICAgIHRoaXMuc3RvcmVGb2N1c2VkRWxlbWVudCgpO1xuICAgICAgICBpZiAoIXRoaXMucGFuZWwpIHRoaXMucGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHsgaXRlbTogdGhpcyB9KTtcbiAgICAgICAgdGhpcy5wYW5lbC5zaG93KClcblxuICAgICAgICB0aGlzLmZvY3VzRmlsdGVyRWRpdG9yKCk7XG4gICAgfVxuICAgIGhpZGUoKSB7XG4gICAgICAgIHRoaXMucGFuZWwuaGlkZSgpO1xuICAgICAgICB0aGlzLnJlc3RvcmVGb2N1cygpO1xuICAgIH1cblxuICAgIGNhbmNlbGxlZCgpIHtcbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgfVxufVxuIl19