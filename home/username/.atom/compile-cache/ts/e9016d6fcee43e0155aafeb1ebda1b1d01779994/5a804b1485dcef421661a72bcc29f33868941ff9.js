exports.errorsInOpenFiles = { members: [] };
exports.buildOutput = { members: [] };
exports.referencesOutput = { members: [] };
/** This *must* always be set */
exports.activeList = exports.errorsInOpenFiles;
function gotoLine(filePath, line, col, list) {
    var activeFile, activeEditor = atom.workspace.getActiveTextEditor();
    if (activeEditor !== undefined && activeEditor !== null) {
        activeFile = activeEditor.getPath();
    }
    if (filePath !== activeFile) {
        atom.workspace.open(filePath, {
            initialLine: line - 1,
            initialColumn: col
        });
    }
    else {
        atom.workspace.getActiveTextEditor().cursors[0].setBufferPosition([line - 1, col]);
    }
    list.lastPosition = { filePath: filePath, line: line, col: col };
}
exports.gotoLine = gotoLine;
/**
 * Uses `activeList` to go to the next error or loop back
 * Storing `lastPosition` with the list allows us to be lazy elsewhere and actively find the element here
 */
function findCurrentIndexInList() {
    // Early exit if no members
    if (!exports.activeList.members.length) {
        atom.notifications.addInfo('AtomTS: no go-to members in active list');
        return -1;
    }
    // If we don't have a lastPosition then first is the last position
    if (!exports.activeList.lastPosition)
        return 0;
    var lastPosition = exports.activeList.lastPosition;
    var index = indexOf(exports.activeList.members, function (item) { return item.filePath == lastPosition.filePath && item.line == lastPosition.line; });
    // if the item has since been removed go to 0
    if (index == -1) {
        return 0;
    }
    return index;
}
/** Uses `activeList` to go to the next position or loop back */
function gotoNext() {
    var currentIndex = findCurrentIndexInList();
    if (currentIndex == -1)
        return;
    var nextIndex = currentIndex + 1;
    // If next is == length then loop to zero
    if (nextIndex == exports.activeList.members.length) {
        nextIndex = 0;
    }
    var next = exports.activeList.members[nextIndex];
    gotoLine(next.filePath, next.line, next.col, exports.activeList);
}
exports.gotoNext = gotoNext;
function gotoPrevious() {
    var currentIndex = findCurrentIndexInList();
    if (currentIndex == -1)
        return;
    var previousIndex = currentIndex - 1;
    // If next is == -1 then loop to length
    if (previousIndex == -1) {
        previousIndex = exports.activeList.members.length - 1;
    }
    var previous = exports.activeList.members[previousIndex];
    gotoLine(previous.filePath, previous.line, previous.col, exports.activeList);
}
exports.gotoPrevious = gotoPrevious;
/**
 * Utility Return index of element in an array
 */
function indexOf(items, filter) {
    for (var i = 0; i < items.length; i++) {
        if (filter(items[i])) {
            return i;
        }
    }
    return -1;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2xpYi9tYWluL2F0b20vZ290b0hpc3RvcnkudHMiLCJzb3VyY2VzIjpbIi9ob21lL2phbWVzLy5hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9saWIvbWFpbi9hdG9tL2dvdG9IaXN0b3J5LnRzIl0sIm5hbWVzIjpbImdvdG9MaW5lIiwiZmluZEN1cnJlbnRJbmRleEluTGlzdCIsImdvdG9OZXh0IiwiZ290b1ByZXZpb3VzIiwiaW5kZXhPZiJdLCJtYXBwaW5ncyI6IkFBQ1cseUJBQWlCLEdBQXlCLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDO0FBQzFELG1CQUFXLEdBQXlCLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDO0FBQ3BELHdCQUFnQixHQUF5QixFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQztBQUdwRSxBQURBLGdDQUFnQztBQUNyQixrQkFBVSxHQUF5Qix5QkFBaUIsQ0FBQztBQUVoRSxTQUFnQixRQUFRLENBQUMsUUFBZ0IsRUFBRSxJQUFZLEVBQUUsR0FBVyxFQUFFLElBQTBCO0lBQzVGQSxJQUFJQSxVQUFVQSxFQUNWQSxZQUFZQSxHQUFHQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxtQkFBbUJBLEVBQUVBLENBQUNBO0lBQ3hEQSxFQUFFQSxDQUFDQSxDQUFDQSxZQUFZQSxLQUFLQSxTQUFTQSxJQUFJQSxZQUFZQSxLQUFLQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN0REEsVUFBVUEsR0FBR0EsWUFBWUEsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0E7SUFDeENBLENBQUNBO0lBRURBLEVBQUVBLENBQUNBLENBQUNBLFFBQVFBLEtBQUtBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBO1FBQzFCQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxFQUFFQTtZQUMxQkEsV0FBV0EsRUFBRUEsSUFBSUEsR0FBR0Es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dGhHb3RvUG9zaXRpb25zID0geyBtZW1iZXJzOiBbXSB9O1xuZXhwb3J0IHZhciBidWlsZE91dHB1dDogVGFiV2l0aEdvdG9Qb3NpdGlvbnMgPSB7IG1lbWJlcnM6IFtdIH07XG5leHBvcnQgdmFyIHJlZmVyZW5jZXNPdXRwdXQ6IFRhYldpdGhHb3RvUG9zaXRpb25zID0geyBtZW1iZXJzOiBbXSB9O1xuXG4vKiogVGhpcyAqbXVzdCogYWx3YXlzIGJlIHNldCAqL1xuZXhwb3J0IHZhciBhY3RpdmVMaXN0OiBUYWJXaXRoR290b1Bvc2l0aW9ucyA9IGVycm9yc0luT3BlbkZpbGVzO1xuXG5leHBvcnQgZnVuY3Rpb24gZ290b0xpbmUoZmlsZVBhdGg6IHN0cmluZywgbGluZTogbnVtYmVyLCBjb2w6IG51bWJlciwgbGlzdDogVGFiV2l0aEdvdG9Qb3NpdGlvbnMpIHtcbiAgICB2YXIgYWN0aXZlRmlsZSxcbiAgICAgICAgYWN0aXZlRWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgIGlmIChhY3RpdmVFZGl0b3IgIT09IHVuZGVmaW5lZCAmJiBhY3RpdmVFZGl0b3IgIT09IG51bGwpIHtcbiAgICAgICAgYWN0aXZlRmlsZSA9IGFjdGl2ZUVkaXRvci5nZXRQYXRoKCk7XG4gICAgfVxuXG4gICAgaWYgKGZpbGVQYXRoICE9PSBhY3RpdmVGaWxlKSB7XG4gICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oZmlsZVBhdGgsIHtcbiAgICAgICAgICAgIGluaXRpYWxMaW5lOiBsaW5lIC0gMSxcbiAgICAgICAgICAgIGluaXRpYWxDb2x1bW46IGNvbFxuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCkuY3Vyc29yc1swXS5zZXRCdWZmZXJQb3NpdGlvbihbbGluZSAtIDEsIGNvbF0pO1xuICAgIH1cblxuICAgIGxpc3QubGFzdFBvc2l0aW9uID0geyBmaWxlUGF0aCwgbGluZSwgY29sIH07XG59XG5cbi8qKlxuICogVXNlcyBgYWN0aXZlTGlzdGAgdG8gZ28gdG8gdGhlIG5leHQgZXJyb3Igb3IgbG9vcCBiYWNrXG4gKiBTdG9yaW5nIGBsYXN0UG9zaXRpb25gIHdpdGggdGhlIGxpc3QgYWxsb3dzIHVzIHRvIGJlIGxhenkgZWxzZXdoZXJlIGFuZCBhY3RpdmVseSBmaW5kIHRoZSBlbGVtZW50IGhlcmVcbiAqL1xuZnVuY3Rpb24gZmluZEN1cnJlbnRJbmRleEluTGlzdCgpOiBudW1iZXIge1xuICAgIC8vIEVhcmx5IGV4aXQgaWYgbm8gbWVtYmVyc1xuICAgIGlmICghYWN0aXZlTGlzdC5tZW1iZXJzLmxlbmd0aCkge1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbygnQXRvbVRTOiBubyBnby10byBtZW1iZXJzIGluIGFjdGl2ZSBsaXN0Jyk7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhIGxhc3RQb3NpdGlvbiB0aGVuIGZpcnN0IGlzIHRoZSBsYXN0IHBvc2l0aW9uXG4gICAgaWYgKCFhY3RpdmVMaXN0Lmxhc3RQb3NpdGlvbilcbiAgICAgICAgcmV0dXJuIDA7XG5cbiAgICB2YXIgbGFzdFBvc2l0aW9uID0gYWN0aXZlTGlzdC5sYXN0UG9zaXRpb247XG4gICAgdmFyIGluZGV4ID0gaW5kZXhPZihhY3RpdmVMaXN0Lm1lbWJlcnMsIChpdGVtKSA9PiBpdGVtLmZpbGVQYXRoID09IGxhc3RQb3NpdGlvbi5maWxlUGF0aCAmJiBpdGVtLmxpbmUgPT0gbGFzdFBvc2l0aW9uLmxpbmUpO1xuXG4gICAgLy8gaWYgdGhlIGl0ZW0gaGFzIHNpbmNlIGJlZW4gcmVtb3ZlZCBnbyB0byAwXG4gICAgaWYgKGluZGV4ID09IC0xKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG59XG5cbi8qKiBVc2VzIGBhY3RpdmVMaXN0YCB0byBnbyB0byB0aGUgbmV4dCBwb3NpdGlvbiBvciBsb29wIGJhY2sgKi9cbmV4cG9ydCBmdW5jdGlvbiBnb3RvTmV4dCgpIHtcbiAgICB2YXIgY3VycmVudEluZGV4ID0gZmluZEN1cnJlbnRJbmRleEluTGlzdCgpO1xuICAgIGlmIChjdXJyZW50SW5kZXggPT0gLTEpIHJldHVybjtcblxuICAgIHZhciBuZXh0SW5kZXggPSBjdXJyZW50SW5kZXggKyAxO1xuICAgIC8vIElmIG5leHQgaXMgPT0gbGVuZ3RoIHRoZW4gbG9vcCB0byB6ZXJvXG4gICAgaWYgKG5leHRJbmRleCA9PSBhY3RpdmVMaXN0Lm1lbWJlcnMubGVuZ3RoKSB7XG4gICAgICAgIG5leHRJbmRleCA9IDA7XG4gICAgfVxuXG4gICAgdmFyIG5leHQgPSBhY3RpdmVMaXN0Lm1lbWJlcnNbbmV4dEluZGV4XTtcbiAgICBnb3RvTGluZShuZXh0LmZpbGVQYXRoLCBuZXh0LmxpbmUsIG5leHQuY29sLCBhY3RpdmVMaXN0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdvdG9QcmV2aW91cygpIHtcbiAgICB2YXIgY3VycmVudEluZGV4ID0gZmluZEN1cnJlbnRJbmRleEluTGlzdCgpO1xuICAgIGlmIChjdXJyZW50SW5kZXggPT0gLTEpIHJldHVybjtcblxuICAgIHZhciBwcmV2aW91c0luZGV4ID0gY3VycmVudEluZGV4IC0gMTtcbiAgICAvLyBJZiBuZXh0IGlzID09IC0xIHRoZW4gbG9vcCB0byBsZW5ndGhcbiAgICBpZiAocHJldmlvdXNJbmRleCA9PSAtMSkge1xuICAgICAgICBwcmV2aW91c0luZGV4ID0gYWN0aXZlTGlzdC5tZW1iZXJzLmxlbmd0aCAtIDE7XG4gICAgfVxuXG4gICAgdmFyIHByZXZpb3VzID0gYWN0aXZlTGlzdC5tZW1iZXJzW3ByZXZpb3VzSW5kZXhdO1xuICAgIGdvdG9MaW5lKHByZXZpb3VzLmZpbGVQYXRoLCBwcmV2aW91cy5saW5lLCBwcmV2aW91cy5jb2wsIGFjdGl2ZUxpc3QpO1xufVxuXG5cbi8qKlxuICogVXRpbGl0eSBSZXR1cm4gaW5kZXggb2YgZWxlbWVudCBpbiBhbiBhcnJheVxuICovXG5mdW5jdGlvbiBpbmRleE9mPFQ+KGl0ZW1zOiBUW10sIGZpbHRlcjogKGl0ZW06IFQpID0+IGJvb2xlYW4pOiBudW1iZXIge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGZpbHRlcihpdGVtc1tpXSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cbiJdfQ==