var mainPanelView = require('./views/mainPanelView');
var lineMessageView = require('./views/lineMessageView');
var gotoHistory = require('./gotoHistory');
function getTitle(errorCount) {
    var title = '<span class="icon-circuit-board"></span> TypeScript Build';
    if (errorCount > 0) {
        title = title + (" (\n            <span class=\"text-highlight\" style=\"font-weight: bold\"> " + errorCount + " </span>\n            <span class=\"text-error\" style=\"font-weight: bold;\"> error" + (errorCount === 1 ? "" : "s") + " </span>\n        )");
    }
    return title;
}
function setBuildOutput(buildOutput) {
    mainPanelView.panelView.clearBuild();
    if (buildOutput.counts.errors) {
        mainPanelView.panelView.setBuildPanelCount(buildOutput.counts.errors);
    }
    else {
        mainPanelView.panelView.setBuildPanelCount(0);
    }
    // Update the errors list for goto history
    gotoHistory.buildOutput.members = [];
    buildOutput.outputs.forEach(function (output) {
        if (output.success) {
            return;
        }
        output.errors.forEach(function (error) {
            mainPanelView.panelView.addBuild(new lineMessageView.LineMessageView({
                goToLine: function (filePath, line, col) { return gotoHistory.gotoLine(filePath, line, col, gotoHistory.buildOutput); },
                message: error.message,
                line: error.startPos.line + 1,
                col: error.startPos.col,
                file: error.filePath,
                preview: error.preview
            }));
            // Update the errors list for goto history
            gotoHistory.buildOutput.members.push({ filePath: error.filePath, line: error.startPos.line + 1, col: error.startPos.col });
        });
    });
    if (!buildOutput.counts.errors) {
        atom.notifications.addSuccess("Build success");
    }
    else if (buildOutput.counts.emitErrors) {
        atom.notifications.addError("Emits errors: " + buildOutput.counts.emitErrors + " files.");
    }
    else {
        atom.notifications.addWarning('Compile failed but emit succeeded');
    }
}
exports.setBuildOutput = setBuildOutput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2xpYi9tYWluL2F0b20vYnVpbGRWaWV3LnRzIiwic291cmNlcyI6WyIvaG9tZS9qYW1lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvbGliL21haW4vYXRvbS9idWlsZFZpZXcudHMiXSwibmFtZXMiOlsiZ2V0VGl0bGUiLCJzZXRCdWlsZE91dHB1dCJdLCJtYXBwaW5ncyI6IkFBU0EsSUFBTyxhQUFhLFdBQVcsdUJBQXVCLENBQUMsQ0FBQztBQUN4RCxJQUFPLGVBQWUsV0FBVyx5QkFBeUIsQ0FBQyxDQUFDO0FBQzVELElBQU8sV0FBVyxXQUFXLGVBQWUsQ0FBQyxDQUFDO0FBRTlDLFNBQVMsUUFBUSxDQUFDLFVBQWtCO0lBQ2hDQSxJQUFJQSxLQUFLQSxHQUFHQSwyREFBMkRBLENBQUNBO0lBQ3hFQSxFQUFFQSxDQUFDQSxDQUFDQSxVQUFVQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNqQkEsS0FBS0EsR0FBR0EsS0FBS0EsR0FBR0Esa0ZBQzhDQSxVQUFVQSw2RkFDUkEsVUFBVUEsS0FBS0EsQ0FBQ0EsR0FBR0EsRUFBRUEsR0FBR0EsR0FBR0EsMEJBQ3pGQSxDQUFDQTtJQUNQQSxDQUFDQTtJQUNEQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQTtBQUNqQkEsQ0FBQ0E7QUFHRCxTQUFnQixjQUFjLENBQUMsV0FBd0I7SUFFbkRDLGFBQWFBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLEVBQUVBLENBQUNBO0lBRXJDQSxFQUFFQSxDQUFDQSxDQUFDQSxXQUFXQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM1QkEsYUFBYUEsQ0FBQ0EsU0FBU0EsQ0FBQ0Esa0JBQWtCQSxDQUFDQSxXQUFXQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtJQUMxRUEsQ0FBQ0E7SUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDRkEsYUFBYUEsQ0FBQ0EsU0FBU0EsQ0FBQ0Esa0JBQWtCQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUNsREEsQ0FBQ0E7SUFHREEsQUFEQUEsMENBQTBDQTtJQUMxQ0EsV0FBV0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsT0FBT0EsR0FBR0EsRUFBRUEsQ0FBQ0E7SUFFckNBLFdBQVdBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLFVBQUFBLE1BQU1BO1FBQzlCQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNqQkEsTUFBTUEsQ0FBQ0E7UUFDWEEsQ0FBQ0E7UUFDREEsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBQUEsS0FBS0E7WUFDdkJBLGFBQWFBLENBQUNBLFNBQVNBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLGVBQWVBLENBQUNBLGVBQWVBLENBQUNBO2dCQUNqRUEsUUFBUUEsRUFBRUEsVUFBQ0EsUUFBUUEsRUFBRUEsSUFBSUEsRUFBRUEsR0FBR0EsSUFBS0EsT0FBQUEsV0FBV0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsRUFBRUEsSUFBSUEsRUFBRUEsR0FBR0EsRUFBRUEsV0FBV0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsRUFBbEVBLENBQWtFQTtnQkFDckdBLE9BQU9BLEVBQUVBLEtBQUtBLENBQUNBLE9BQU9BO2dCQUN0QkEsSUFBSUEsRUFBRUEsS0FBS0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0E7Z0JBQzdCQSxHQUFHQSxFQUFFQSxLQUFLQSxDQUFDQSxRQUFRQSxDQUFDQSxHQUFHQTtnQkFDdkJBLElBQUlBLEVBQUVBLEtBQUtBLENBQUNBLFFBQVFBO2dCQUNwQkEsT0FBT0EsRUFBRUEsS0FBS0EsQ0FBQ0EsT0FBT0E7YUFDekJBLENBQUNBLENBQUNBLENBQUNBO1lBRUpBLEFBREFBLDBDQUEwQ0E7WUFDMUNBLFdBQVdBLENBQUNBLFdBQVdBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLEtBQUtBLENBQUNBLFFBQVFBLEVBQUVBLElBQUlBLEVBQUVBLEtBQUtBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLEVBQUVBLEtBQUtBLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBO1FBQy9IQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUNQQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUVIQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxXQUFXQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsQ0FBQ0E7SUFDbkRBLENBQUNBO0lBQ0RBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLFdBQVdBLENBQUNBLE1BQU1BLENBQUNBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBO1FBQ3JDQSxJQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxRQUFRQSxDQUFDQSxnQkFBZ0JBLEdBQUdBLFdBQVdBLENBQUNBLE1BQU1BLENBQUNBLFVBQVVBLEdBQUdBLFNBQVNBLENBQUNBLENBQUNBO0lBQzlGQSxDQUFDQTtJQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNKQSxJQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxVQUFVQSxDQUFDQSxtQ0FBbUNBLENBQUNBLENBQUNBO0lBQ3ZFQSxDQUFDQTtBQUNMQSxDQUFDQTtBQXhDZSxzQkFBYyxHQUFkLGNBd0NmLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuLy8vdHM6aW1wb3J0PXV0aWxzXG5pbXBvcnQgdXRpbHMgPSByZXF1aXJlKCcuLi9sYW5nL3V0aWxzJyk7IC8vL3RzOmltcG9ydDpnZW5lcmF0ZWRcbi8vL3RzOmltcG9ydD1wcm9qZWN0XG5pbXBvcnQgcHJvamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvY29yZS9wcm9qZWN0Jyk7IC8vL3RzOmltcG9ydDpnZW5lcmF0ZWRcblxuaW1wb3J0IG9zID0gcmVxdWlyZSgnb3MnKVxuXG5pbXBvcnQgbWFpblBhbmVsVmlldyA9IHJlcXVpcmUoJy4vdmlld3MvbWFpblBhbmVsVmlldycpO1xuaW1wb3J0IGxpbmVNZXNzYWdlVmlldyA9IHJlcXVpcmUoJy4vdmlld3MvbGluZU1lc3NhZ2VWaWV3Jyk7XG5pbXBvcnQgZ290b0hpc3RvcnkgPSByZXF1aXJlKCcuL2dvdG9IaXN0b3J5Jyk7XG5cbmZ1bmN0aW9uIGdldFRpdGxlKGVycm9yQ291bnQ6IG51bWJlcik6IHN0cmluZyB7XG4gICAgdmFyIHRpdGxlID0gJzxzcGFuIGNsYXNzPVwiaWNvbi1jaXJjdWl0LWJvYXJkXCI+PC9zcGFuPiBUeXBlU2NyaXB0IEJ1aWxkJztcbiAgICBpZiAoZXJyb3JDb3VudCA+IDApIHtcbiAgICAgICAgdGl0bGUgPSB0aXRsZSArIGAgKFxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LWhpZ2hsaWdodFwiIHN0eWxlPVwiZm9udC13ZWlnaHQ6IGJvbGRcIj4gJHtlcnJvckNvdW50fSA8L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cInRleHQtZXJyb3JcIiBzdHlsZT1cImZvbnQtd2VpZ2h0OiBib2xkO1wiPiBlcnJvciR7ZXJyb3JDb3VudCA9PT0gMSA/IFwiXCIgOiBcInNcIn0gPC9zcGFuPlxuICAgICAgICApYDtcbiAgICB9XG4gICAgcmV0dXJuIHRpdGxlO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRCdWlsZE91dHB1dChidWlsZE91dHB1dDogQnVpbGRPdXRwdXQpIHtcblxuICAgIG1haW5QYW5lbFZpZXcucGFuZWxWaWV3LmNsZWFyQnVpbGQoKTtcblxuICAgIGlmIChidWlsZE91dHB1dC5jb3VudHMuZXJyb3JzKSB7XG4gICAgICAgIG1haW5QYW5lbFZpZXcucGFuZWxWaWV3LnNldEJ1aWxkUGFuZWxDb3VudChidWlsZE91dHB1dC5jb3VudHMuZXJyb3JzKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG1haW5QYW5lbFZpZXcucGFuZWxWaWV3LnNldEJ1aWxkUGFuZWxDb3VudCgwKTtcbiAgICB9XG4gICAgXG4gICAgLy8gVXBkYXRlIHRoZSBlcnJvcnMgbGlzdCBmb3IgZ290byBoaXN0b3J5XG4gICAgZ290b0hpc3RvcnkuYnVpbGRPdXRwdXQubWVtYmVycyA9IFtdO1xuXG4gICAgYnVpbGRPdXRwdXQub3V0cHV0cy5mb3JFYWNoKG91dHB1dCA9PiB7XG4gICAgICAgIGlmIChvdXRwdXQuc3VjY2Vzcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dHB1dC5lcnJvcnMuZm9yRWFjaChlcnJvciA9PiB7XG4gICAgICAgICAgICBtYWluUGFuZWxWaWV3LnBhbmVsVmlldy5hZGRCdWlsZChuZXcgbGluZU1lc3NhZ2VWaWV3LkxpbmVNZXNzYWdlVmlldyh7XG4gICAgICAgICAgICAgICAgZ29Ub0xpbmU6IChmaWxlUGF0aCwgbGluZSwgY29sKSA9PiBnb3RvSGlzdG9yeS5nb3RvTGluZShmaWxlUGF0aCwgbGluZSwgY29sLCBnb3RvSGlzdG9yeS5idWlsZE91dHB1dCksXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgICAgICAgICBsaW5lOiBlcnJvci5zdGFydFBvcy5saW5lICsgMSxcbiAgICAgICAgICAgICAgICBjb2w6IGVycm9yLnN0YXJ0UG9zLmNvbCxcbiAgICAgICAgICAgICAgICBmaWxlOiBlcnJvci5maWxlUGF0aCxcbiAgICAgICAgICAgICAgICBwcmV2aWV3OiBlcnJvci5wcmV2aWV3XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGVycm9ycyBsaXN0IGZvciBnb3RvIGhpc3RvcnlcbiAgICAgICAgICAgIGdvdG9IaXN0b3J5LmJ1aWxkT3V0cHV0Lm1lbWJlcnMucHVzaCh7IGZpbGVQYXRoOiBlcnJvci5maWxlUGF0aCwgbGluZTogZXJyb3Iuc3RhcnRQb3MubGluZSArIDEsIGNvbDogZXJyb3Iuc3RhcnRQb3MuY29sIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGlmICghYnVpbGRPdXRwdXQuY291bnRzLmVycm9ycykge1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkU3VjY2VzcyhcIkJ1aWxkIHN1Y2Nlc3NcIik7XG4gICAgfVxuICAgIGVsc2UgaWYgKGJ1aWxkT3V0cHV0LmNvdW50cy5lbWl0RXJyb3JzKSB7XG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcIkVtaXRzIGVycm9yczogXCIgKyBidWlsZE91dHB1dC5jb3VudHMuZW1pdEVycm9ycyArIFwiIGZpbGVzLlwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZygnQ29tcGlsZSBmYWlsZWQgYnV0IGVtaXQgc3VjY2VlZGVkJyk7XG4gICAgfVxufVxuIl19