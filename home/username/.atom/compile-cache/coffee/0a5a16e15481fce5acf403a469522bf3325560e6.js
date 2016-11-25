(function() {
  var SearchHistoryManager, _, settings;

  _ = require('underscore-plus');

  settings = require('./settings');

  module.exports = SearchHistoryManager = (function() {
    SearchHistoryManager.prototype.idx = null;

    function SearchHistoryManager(vimState) {
      this.vimState = vimState;
      this.globalState = this.vimState.globalState;
      this.idx = -1;
    }

    SearchHistoryManager.prototype.get = function(direction) {
      var ref;
      switch (direction) {
        case 'prev':
          if ((this.idx + 1) !== this.getSize()) {
            this.idx += 1;
          }
          break;
        case 'next':
          if (!(this.idx === -1)) {
            this.idx -= 1;
          }
      }
      return (ref = this.globalState.get('searchHistory')[this.idx]) != null ? ref : '';
    };

    SearchHistoryManager.prototype.save = function(entry) {
      if (_.isEmpty(entry)) {
        return;
      }
      this.replaceEntries(_.uniq([entry].concat(this.getEntries())));
      if (this.getSize() > settings.get('historySize')) {
        return this.getEntries().splice(settings.get('historySize'));
      }
    };

    SearchHistoryManager.prototype.reset = function() {
      return this.idx = -1;
    };

    SearchHistoryManager.prototype.clear = function() {
      return this.replaceEntries([]);
    };

    SearchHistoryManager.prototype.getSize = function() {
      return this.getEntries().length;
    };

    SearchHistoryManager.prototype.getEntries = function() {
      return this.globalState.get('searchHistory');
    };

    SearchHistoryManager.prototype.replaceEntries = function(entries) {
      return this.globalState.set('searchHistory', entries);
    };

    SearchHistoryManager.prototype.destroy = function() {
      return this.idx = null;
    };

    return SearchHistoryManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvc2VhcmNoLWhpc3RvcnktbWFuYWdlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUVYLE1BQU0sQ0FBQyxPQUFQLEdBQ007bUNBQ0osR0FBQSxHQUFLOztJQUVRLDhCQUFDLFFBQUQ7TUFBQyxJQUFDLENBQUEsV0FBRDtNQUNYLElBQUMsQ0FBQSxjQUFlLElBQUMsQ0FBQSxTQUFoQjtNQUNGLElBQUMsQ0FBQSxHQUFELEdBQU8sQ0FBQztJQUZHOzttQ0FJYixHQUFBLEdBQUssU0FBQyxTQUFEO0FBQ0gsVUFBQTtBQUFBLGNBQU8sU0FBUDtBQUFBLGFBQ08sTUFEUDtVQUNtQixJQUFpQixDQUFDLElBQUMsQ0FBQSxHQUFELEdBQU8sQ0FBUixDQUFBLEtBQWMsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUEvQjtZQUFBLElBQUMsQ0FBQSxHQUFELElBQVEsRUFBUjs7QUFBWjtBQURQLGFBRU8sTUFGUDtVQUVtQixJQUFBLENBQWlCLENBQUMsSUFBQyxDQUFBLEdBQUQsS0FBUSxDQUFDLENBQVYsQ0FBakI7WUFBQSxJQUFDLENBQUEsR0FBRCxJQUFRLEVBQVI7O0FBRm5CO3FGQUcwQztJQUp2Qzs7bUNBTUwsSUFBQSxHQUFNLFNBQUMsS0FBRDtNQUNKLElBQVUsQ0FBQyxDQUFDLE9BQUYsQ0FBVSxLQUFWLENBQVY7QUFBQSxlQUFBOztNQUNBLElBQUMsQ0FBQSxjQUFELENBQWdCLENBQUMsQ0FBQyxJQUFGLENBQU8sQ0FBQyxLQUFELENBQU8sQ0FBQyxNQUFSLENBQWUsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFmLENBQVAsQ0FBaEI7TUFDQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBQSxHQUFhLFFBQVEsQ0FBQyxHQUFULENBQWEsYUFBYixDQUFoQjtlQUNFLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBYSxDQUFDLE1BQWQsQ0FBcUIsUUFBUSxDQUFDLEdBQVQsQ0FBYSxhQUFiLENBQXJCLEVBREY7O0lBSEk7O21DQU1OLEtBQUEsR0FBTyxTQUFBO2FBQ0wsSUFBQyxDQUFBLEdBQUQsR0FBTyxDQUFDO0lBREg7O21DQUdQLEtBQUEsR0FBTyxTQUFBO2FBQ0wsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsRUFBaEI7SUFESzs7bUNBR1AsT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsVUFBRCxDQUFBLENBQWEsQ0FBQztJQURQOzttQ0FHVCxVQUFBLEdBQVksU0FBQTthQUNWLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixlQUFqQjtJQURVOzttQ0FHWixjQUFBLEdBQWdCLFNBQUMsT0FBRDthQUNkLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixlQUFqQixFQUFrQyxPQUFsQztJQURjOzttQ0FHaEIsT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsR0FBRCxHQUFPO0lBREE7Ozs7O0FBdENYIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbnNldHRpbmdzID0gcmVxdWlyZSAnLi9zZXR0aW5ncydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgU2VhcmNoSGlzdG9yeU1hbmFnZXJcbiAgaWR4OiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAdmltU3RhdGUpIC0+XG4gICAge0BnbG9iYWxTdGF0ZX0gPSBAdmltU3RhdGVcbiAgICBAaWR4ID0gLTFcblxuICBnZXQ6IChkaXJlY3Rpb24pIC0+XG4gICAgc3dpdGNoIGRpcmVjdGlvblxuICAgICAgd2hlbiAncHJldicgdGhlbiBAaWR4ICs9IDEgdW5sZXNzIChAaWR4ICsgMSkgaXMgQGdldFNpemUoKVxuICAgICAgd2hlbiAnbmV4dCcgdGhlbiBAaWR4IC09IDEgdW5sZXNzIChAaWR4IGlzIC0xKVxuICAgIEBnbG9iYWxTdGF0ZS5nZXQoJ3NlYXJjaEhpc3RvcnknKVtAaWR4XSA/ICcnXG5cbiAgc2F2ZTogKGVudHJ5KSAtPlxuICAgIHJldHVybiBpZiBfLmlzRW1wdHkoZW50cnkpXG4gICAgQHJlcGxhY2VFbnRyaWVzIF8udW5pcShbZW50cnldLmNvbmNhdCBAZ2V0RW50cmllcygpKVxuICAgIGlmIEBnZXRTaXplKCkgPiBzZXR0aW5ncy5nZXQoJ2hpc3RvcnlTaXplJylcbiAgICAgIEBnZXRFbnRyaWVzKCkuc3BsaWNlIHNldHRpbmdzLmdldCgnaGlzdG9yeVNpemUnKVxuXG4gIHJlc2V0OiAtPlxuICAgIEBpZHggPSAtMVxuXG4gIGNsZWFyOiAtPlxuICAgIEByZXBsYWNlRW50cmllcyBbXVxuXG4gIGdldFNpemU6IC0+XG4gICAgQGdldEVudHJpZXMoKS5sZW5ndGhcblxuICBnZXRFbnRyaWVzOiAtPlxuICAgIEBnbG9iYWxTdGF0ZS5nZXQoJ3NlYXJjaEhpc3RvcnknKVxuXG4gIHJlcGxhY2VFbnRyaWVzOiAoZW50cmllcykgLT5cbiAgICBAZ2xvYmFsU3RhdGUuc2V0KCdzZWFyY2hIaXN0b3J5JywgZW50cmllcylcblxuICBkZXN0cm95OiAtPlxuICAgIEBpZHggPSBudWxsXG4iXX0=
