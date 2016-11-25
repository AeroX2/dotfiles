(function() {
  var Hover, HoverElement, emoji, emojiFolder, registerElement, settings, swrap,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  emoji = require('emoji-images');

  emojiFolder = 'atom://vim-mode-plus/node_modules/emoji-images/pngs';

  registerElement = require('./utils').registerElement;

  settings = require('./settings');

  swrap = require('./selection-wrapper');

  Hover = (function(superClass) {
    extend(Hover, superClass);

    function Hover() {
      return Hover.__super__.constructor.apply(this, arguments);
    }

    Hover.prototype.createdCallback = function() {
      this.className = 'vim-mode-plus-hover';
      this.text = [];
      return this;
    };

    Hover.prototype.initialize = function(vimState) {
      var ref;
      this.vimState = vimState;
      ref = this.vimState, this.editor = ref.editor, this.editorElement = ref.editorElement;
      return this;
    };

    Hover.prototype.getPoint = function() {
      var ref;
      if (this.vimState.isMode('visual', 'blockwise')) {
        return (ref = this.vimState.getLastBlockwiseSelection()) != null ? ref.getHeadSelection().getHeadBufferPosition() : void 0;
      } else {
        return swrap(this.editor.getLastSelection()).getBufferPositionFor('head', {
          fromProperty: true,
          allowFallback: true
        });
      }
    };

    Hover.prototype.add = function(text, point) {
      if (point == null) {
        point = this.getPoint();
      }
      this.text.push(text);
      return this.show(point);
    };

    Hover.prototype.replaceLastSection = function(text, point) {
      this.text.pop();
      return this.add(text);
    };

    Hover.prototype.convertText = function(text, lineHeight) {
      text = String(text);
      if (settings.get('showHoverOnOperateIcon') === 'emoji') {
        return emoji(text, emojiFolder, lineHeight);
      } else {
        return text.replace(/:(.*?):/g, function(s, m) {
          return "<span class='icon icon-" + m + "'></span>";
        });
      }
    };

    Hover.prototype.show = function(point) {
      if (this.marker == null) {
        this.marker = this.createOverlay(point);
        this.lineHeight = this.editor.getLineHeightInPixels();
        this.setIconSize(this.lineHeight);
        this.style.marginTop = (this.lineHeight * -2.2) + 'px';
      }
      if (this.text.length) {
        return this.innerHTML = this.text.map((function(_this) {
          return function(text) {
            return _this.convertText(text, _this.lineHeight);
          };
        })(this)).join('');
      }
    };

    Hover.prototype.withTimeout = function(point, options) {
      var ref;
      this.reset();
      if (options.classList.length) {
        (ref = this.classList).add.apply(ref, options.classList);
      }
      this.add(options.text, point);
      if (options.timeout != null) {
        return this.timeoutID = setTimeout((function(_this) {
          return function() {
            return _this.reset();
          };
        })(this), options.timeout);
      }
    };

    Hover.prototype.createOverlay = function(point) {
      var decoration, marker;
      marker = this.editor.markBufferPosition(point);
      decoration = this.editor.decorateMarker(marker, {
        type: 'overlay',
        item: this
      });
      return marker;
    };

    Hover.prototype.setIconSize = function(size) {
      var ref, selector, style;
      if ((ref = this.styleElement) != null) {
        ref.remove();
      }
      this.styleElement = document.createElement('style');
      document.head.appendChild(this.styleElement);
      selector = '.vim-mode-plus-hover .icon::before';
      size = (size * 0.8) + "px";
      style = "font-size: " + size + "; width: " + size + "; hegith: " + size + ";";
      return this.styleElement.sheet.addRule(selector, style);
    };

    Hover.prototype.isVisible = function() {
      return this.marker != null;
    };

    Hover.prototype.reset = function() {
      var ref, ref1, ref2;
      this.text = [];
      clearTimeout(this.timeoutID);
      this.className = 'vim-mode-plus-hover';
      this.textContent = '';
      if ((ref = this.marker) != null) {
        ref.destroy();
      }
      if ((ref1 = this.styleElement) != null) {
        ref1.remove();
      }
      return ref2 = {}, this.marker = ref2.marker, this.lineHeight = ref2.lineHeight, this.timeoutID = ref2.timeoutID, this.styleElement = ref2.styleElement, ref2;
    };

    Hover.prototype.destroy = function() {
      var ref;
      this.reset();
      ref = {}, this.vimState = ref.vimState, this.lineHeight = ref.lineHeight;
      return this.remove();
    };

    return Hover;

  })(HTMLElement);

  HoverElement = registerElement("vim-mode-plus-hover", {
    prototype: Hover.prototype
  });

  module.exports = {
    HoverElement: HoverElement
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvaG92ZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx5RUFBQTtJQUFBOzs7RUFBQSxLQUFBLEdBQVEsT0FBQSxDQUFRLGNBQVI7O0VBRVIsV0FBQSxHQUFjOztFQUNiLGtCQUFtQixPQUFBLENBQVEsU0FBUjs7RUFDcEIsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUNYLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBRUY7Ozs7Ozs7b0JBQ0osZUFBQSxHQUFpQixTQUFBO01BQ2YsSUFBQyxDQUFBLFNBQUQsR0FBYTtNQUNiLElBQUMsQ0FBQSxJQUFELEdBQVE7YUFDUjtJQUhlOztvQkFLakIsVUFBQSxHQUFZLFNBQUMsUUFBRDtBQUNWLFVBQUE7TUFEVyxJQUFDLENBQUEsV0FBRDtNQUNYLE1BQTRCLElBQUMsQ0FBQSxRQUE3QixFQUFDLElBQUMsQ0FBQSxhQUFBLE1BQUYsRUFBVSxJQUFDLENBQUEsb0JBQUE7YUFDWDtJQUZVOztvQkFJWixRQUFBLEdBQVUsU0FBQTtBQUNSLFVBQUE7TUFBQSxJQUFHLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBVixDQUFpQixRQUFqQixFQUEyQixXQUEzQixDQUFIOzhFQUV1QyxDQUFFLGdCQUF2QyxDQUFBLENBQXlELENBQUMscUJBQTFELENBQUEsV0FGRjtPQUFBLE1BQUE7ZUFJRSxLQUFBLENBQU0sSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUFBLENBQU4sQ0FBaUMsQ0FBQyxvQkFBbEMsQ0FBdUQsTUFBdkQsRUFBK0Q7VUFBQSxZQUFBLEVBQWMsSUFBZDtVQUFvQixhQUFBLEVBQWUsSUFBbkM7U0FBL0QsRUFKRjs7SUFEUTs7b0JBT1YsR0FBQSxHQUFLLFNBQUMsSUFBRCxFQUFPLEtBQVA7O1FBQU8sUUFBTSxJQUFDLENBQUEsUUFB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QVMsQ0FBQyxJQUFBLEdBQUssR0FBTixDQUFBLEdBQVU7TUFDbkIsS0FBQSxHQUFRLGFBQUEsR0FBYyxJQUFkLEdBQW1CLFdBQW5CLEdBQThCLElBQTlCLEdBQW1DLFlBQW5DLEdBQStDLElBQS9DLEdBQW9EO2FBQzVELElBQUMsQ0FBQSxZQUFZLENBQUMsS0FBSyxDQUFDLE9BQXBCLENBQTRCLFFBQTVCLEVBQXNDLEtBQXRDO0lBUFc7O29CQVNiLFNBQUEsR0FBVyxTQUFBO2FBQ1Q7SUFEUzs7b0JBR1gsS0FBQSxHQUFPLFNBQUE7QUFDTCxVQUFBO01BQUEsSUFBQyxDQUFBLElBQUQsR0FBUTtNQUNSLFlBQUEsQ0FBYSxJQUFDLENBQUEsU0FBZDtNQUNBLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFDYixJQUFDLENBQUEsV0FBRCxHQUFlOztXQUNSLENBQUUsT0FBVCxDQUFBOzs7WUFDYSxDQUFFLE1BQWYsQ0FBQTs7YUFDQSxPQUdJLEVBSEosRUFDRSxJQUFDLENBQUEsY0FBQSxNQURILEVBQ1csSUFBQyxDQUFBLGtCQUFBLFVBRFosRUFFRSxJQUFDLENBQUEsaUJBQUEsU0FGSCxFQUVjLElBQUMsQ0FBQSxvQkFBQSxZQUZmLEVBQUE7SUFQSzs7b0JBWVAsT0FBQSxHQUFTLFNBQUE7QUFDUCxVQUFBO01BQUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtNQUNBLE1BQTJCLEVBQTNCLEVBQUMsSUFBQyxDQUFBLGVBQUEsUUFBRixFQUFZLElBQUMsQ0FBQSxpQkFBQTthQUNiLElBQUMsQ0FBQSxNQUFELENBQUE7SUFITzs7OztLQXRGUzs7RUEyRnBCLFlBQUEsR0FBZSxlQUFBLENBQWdCLHFCQUFoQixFQUNiO0lBQUEsU0FBQSxFQUFXLEtBQUssQ0FBQyxTQUFqQjtHQURhOztFQUdmLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBQ2YsY0FBQSxZQURlOztBQXJHakIiLCJzb3VyY2VzQ29udGVudCI6WyJlbW9qaSA9IHJlcXVpcmUgJ2Vtb2ppLWltYWdlcydcblxuZW1vamlGb2xkZXIgPSAnYXRvbTovL3ZpbS1tb2RlLXBsdXMvbm9kZV9tb2R1bGVzL2Vtb2ppLWltYWdlcy9wbmdzJ1xue3JlZ2lzdGVyRWxlbWVudH0gPSByZXF1aXJlICcuL3V0aWxzJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xuXG5jbGFzcyBIb3ZlciBleHRlbmRzIEhUTUxFbGVtZW50XG4gIGNyZWF0ZWRDYWxsYmFjazogLT5cbiAgICBAY2xhc3NOYW1lID0gJ3ZpbS1tb2RlLXBsdXMtaG92ZXInXG4gICAgQHRleHQgPSBbXVxuICAgIHRoaXNcblxuICBpbml0aWFsaXplOiAoQHZpbVN0YXRlKSAtPlxuICAgIHtAZWRpdG9yLCBAZWRpdG9yRWxlbWVudH0gPSBAdmltU3RhdGVcbiAgICB0aGlzXG5cbiAgZ2V0UG9pbnQ6IC0+XG4gICAgaWYgQHZpbVN0YXRlLmlzTW9kZSgndmlzdWFsJywgJ2Jsb2Nrd2lzZScpXG4gICAgICAjIEZJWE1FICMxNzlcbiAgICAgIEB2aW1TdGF0ZS5nZXRMYXN0QmxvY2t3aXNlU2VsZWN0aW9uKCk/LmdldEhlYWRTZWxlY3Rpb24oKS5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgIGVsc2VcbiAgICAgIHN3cmFwKEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpKS5nZXRCdWZmZXJQb3NpdGlvbkZvcignaGVhZCcsIGZyb21Qcm9wZXJ0eTogdHJ1ZSwgYWxsb3dGYWxsYmFjazogdHJ1ZSlcblxuICBhZGQ6ICh0ZXh0LCBwb2ludD1AZ2V0UG9pbnQoKSkgLT5cbiAgICBAdGV4dC5wdXNoKHRleHQpXG4gICAgQHNob3cocG9pbnQpXG5cbiAgcmVwbGFjZUxhc3RTZWN0aW9uOiAodGV4dCwgcG9pbnQpIC0+XG4gICAgQHRleHQucG9wKClcbiAgICBAYWRkKHRleHQpXG5cbiAgY29udmVydFRleHQ6ICh0ZXh0LCBsaW5lSGVpZ2h0KSAtPlxuICAgIHRleHQgPSBTdHJpbmcodGV4dClcbiAgICBpZiBzZXR0aW5ncy5nZXQoJ3Nob3dIb3Zlck9uT3BlcmF0ZUljb24nKSBpcyAnZW1vamknXG4gICAgICBlbW9qaSh0ZXh0LCBlbW9qaUZvbGRlciwgbGluZUhlaWdodClcbiAgICBlbHNlXG4gICAgICB0ZXh0LnJlcGxhY2UgLzooLio/KTovZywgKHMsIG0pIC0+XG4gICAgICAgIFwiPHNwYW4gY2xhc3M9J2ljb24gaWNvbi0je219Jz48L3NwYW4+XCJcblxuICBzaG93OiAocG9pbnQpIC0+XG4gICAgdW5sZXNzIEBtYXJrZXI/XG4gICAgICBAbWFya2VyID0gQGNyZWF0ZU92ZXJsYXkocG9pbnQpXG4gICAgICBAbGluZUhlaWdodCA9IEBlZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKClcbiAgICAgIEBzZXRJY29uU2l6ZShAbGluZUhlaWdodClcbiAgICAgIEBzdHlsZS5tYXJnaW5Ub3AgPSAoQGxpbmVIZWlnaHQgKiAtMi4yKSArICdweCdcblxuICAgIGlmIEB0ZXh0Lmxlbmd0aFxuICAgICAgQGlubmVySFRNTCA9IEB0ZXh0Lm1hcCAodGV4dCkgPT5cbiAgICAgICAgQGNvbnZlcnRUZXh0KHRleHQsIEBsaW5lSGVpZ2h0KVxuICAgICAgLmpvaW4oJycpXG5cbiAgd2l0aFRpbWVvdXQ6IChwb2ludCwgb3B0aW9ucykgLT5cbiAgICBAcmVzZXQoKVxuICAgIGlmIG9wdGlvbnMuY2xhc3NMaXN0Lmxlbmd0aFxuICAgICAgQGNsYXNzTGlzdC5hZGQob3B0aW9ucy5jbGFzc0xpc3QuLi4pXG4gICAgQGFkZChvcHRpb25zLnRleHQsIHBvaW50KVxuICAgIGlmIG9wdGlvbnMudGltZW91dD9cbiAgICAgIEB0aW1lb3V0SUQgPSBzZXRUaW1lb3V0ICA9PlxuICAgICAgICBAcmVzZXQoKVxuICAgICAgLCBvcHRpb25zLnRpbWVvdXRcblxuICBjcmVhdGVPdmVybGF5OiAocG9pbnQpIC0+XG4gICAgbWFya2VyID0gQGVkaXRvci5tYXJrQnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgZGVjb3JhdGlvbiA9IEBlZGl0b3IuZGVjb3JhdGVNYXJrZXIgbWFya2VyLFxuICAgICAgdHlwZTogJ292ZXJsYXknXG4gICAgICBpdGVtOiB0aGlzXG4gICAgbWFya2VyXG5cbiAgc2V0SWNvblNpemU6IChzaXplKSAtPlxuICAgIEBzdHlsZUVsZW1lbnQ/LnJlbW92ZSgpXG4gICAgQHN0eWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3N0eWxlJ1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoQHN0eWxlRWxlbWVudClcbiAgICBzZWxlY3RvciA9ICcudmltLW1vZGUtcGx1cy1ob3ZlciAuaWNvbjo6YmVmb3JlJ1xuICAgIHNpemUgPSBcIiN7c2l6ZSowLjh9cHhcIlxuICAgIHN0eWxlID0gXCJmb250LXNpemU6ICN7c2l6ZX07IHdpZHRoOiAje3NpemV9OyBoZWdpdGg6ICN7c2l6ZX07XCJcbiAgICBAc3R5bGVFbGVtZW50LnNoZWV0LmFkZFJ1bGUoc2VsZWN0b3IsIHN0eWxlKVxuXG4gIGlzVmlzaWJsZTogLT5cbiAgICBAbWFya2VyP1xuXG4gIHJlc2V0OiAtPlxuICAgIEB0ZXh0ID0gW11cbiAgICBjbGVhclRpbWVvdXQgQHRpbWVvdXRJRFxuICAgIEBjbGFzc05hbWUgPSAndmltLW1vZGUtcGx1cy1ob3ZlcidcbiAgICBAdGV4dENvbnRlbnQgPSAnJ1xuICAgIEBtYXJrZXI/LmRlc3Ryb3koKVxuICAgIEBzdHlsZUVsZW1lbnQ/LnJlbW92ZSgpXG4gICAge1xuICAgICAgQG1hcmtlciwgQGxpbmVIZWlnaHRcbiAgICAgIEB0aW1lb3V0SUQsIEBzdHlsZUVsZW1lbnRcbiAgICB9ID0ge31cblxuICBkZXN0cm95OiAtPlxuICAgIEByZXNldCgpXG4gICAge0B2aW1TdGF0ZSwgQGxpbmVIZWlnaHR9ID0ge31cbiAgICBAcmVtb3ZlKClcblxuSG92ZXJFbGVtZW50ID0gcmVnaXN0ZXJFbGVtZW50IFwidmltLW1vZGUtcGx1cy1ob3ZlclwiLFxuICBwcm90b3R5cGU6IEhvdmVyLnByb3RvdHlwZVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgSG92ZXJFbGVtZW50XG59XG4iXX0=
