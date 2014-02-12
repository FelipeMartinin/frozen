// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview This implements a special button that is useful for showing a
 * context menu.
 */

cr.define('cr.ui', function() {
  /** @const */ var MenuButton = cr.ui.MenuButton;

  /**
   * Helper function for ContextMenuButton to find the first ancestor of the
   * button that has a context menu.
   * @param {!MenuButton} el The button to start the search from.
   * @return {HTMLElement} The found element or null if not found.
   */
  function getContextMenuTarget(el) {
    do {
      el = el.parentNode;
    } while (el && !('contextMenu' in el));
    return el;
  }

  /**
   * Creates a new menu button which is used to show the context menu for an
   * ancestor that has a {@code contextMenu} property.
   * @param {Object=} opt_propertyBag Optional properties.
   * @constructor
   * @extends {MenuButton}
   */
  var ContextMenuButton = cr.ui.define('button');

  ContextMenuButton.prototype = {
    __proto__: MenuButton.prototype,

    /**
     * Override to return the contextMenu for the ancestor.
     * @override
     * @type {cr.ui.Menu}
     */
    get menu() {
      var target = getContextMenuTarget(this);
      return target && target.contextMenu;
    },

    /** @inheritDoc */
    decorate: function() {
      this.tabIndex = -1;
      this.addEventListener('mouseup', this);
      MenuButton.prototype.decorate.call(this);
    },

    /** @inheritDoc */
    handleEvent: function(e) {
      switch (e.type) {
        case 'mousedown':
          // Menu buttons prevent focus changes.
          var target = getContextMenuTarget(this);
          if (target)
            target.focus();
          break;
        case 'mouseup':
          // Stop mouseup to prevent selection changes.
          e.stopPropagation();
          break;
      }
      MenuButton.prototype.handleEvent.call(this, e);
    }
  };

  // Export
  return {
    ContextMenuButton: ContextMenuButton
  };
});
