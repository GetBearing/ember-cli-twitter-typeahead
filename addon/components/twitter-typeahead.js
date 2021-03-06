import Ember from "ember";

const {
  $,
  get,
  observer,
  run
  } = Ember;

/**
 * Usage:
 *
 * {{twitter-typeahead
 *
 * content=arrayOfDataForTypeahead
 * filterContent=filterContentFn
 * displayKey="somePropertyToDisplayStuff"
 * valueToken="somePropertyToFilterOn"
 * footerTemplate=somePropertyThatMapsToHandlebarsFunction
 * emptyTemplate=somePropertyThatMapsToHandlebarsFunction
 * on-select-without-match="someActionNameToHandleWhenThereIsn'tAMatchInTheList"
 *
 * }}
 */

export default Ember.TextField.extend({
  didInsertElement() {
    run.scheduleOnce('afterRender', this, '_initializeTypeahead');
  },

  classNames: [ 'form-control' ],

  keyUp(event) {
    if (event.which === 13 || event.which === 9) {
      const $dropdownMenu = this.$().siblings('.tt-dropdown-menu');
      const $suggestions = $dropdownMenu.find('.tt-suggestion:not(.enter-suggest)');
      if ($suggestions.length) {
        $suggestions.first().click();
        this.setSelectionValue()
      } else {
        this.sendAction('on-select-without-match', this, this.$().val());
      }
    }
  },

  _filterContent(query) {
    const regex = new RegExp(query, 'i');
    const valueKey = this.get('valueToken');
    return this.get('content').filter((thing) => {
      return regex.test(get(thing, valueKey));
    });
  },

  _initializeTypeahead() {
    this.$().typeahead({
    }, {
      minLength: 0,
      displayKey: run.bind(this, (object) => {
        return get(object, this.get('displayKey'));
      }),
      source: run.bind(this, (query, cb) => {
        const content = this.get('content');
        if (!query || query === '*') {
          return cb(content);
        }
        cb(this._filterContent(query));
      }),
      templates: {
        footer(object) {
          if (object.isEmpty) {
            return '';
          } else {
//            return '<span class="tt-suggestion enter-suggest">Footer</span>';
          }
        },
        empty() {
          return "<span class='tt-suggestion enter-suggest'>No Results</span>";
        }
      }
      /* jshint unused:false */
    }).on('typeahead:selected typeahead:autocompleted', run.bind(this, (e, obj, dataSet) => {
      this.set('selection', obj);
    }));
  },

  focusOut() {
    const query = this.$().typeahead('val');
    const results = this._filterContent(query);
    if ($.trim(query).length) {
      if (results.length) {
        this.set('selection', results[0]);
      } else {
        this.sendAction('on-select-without-match', this, query);
      }
    }
  },

  setTypeaheadValue: observer('selection', function() {
    run.once(this, 'setSelectionValue');
  }),

  setSelectionValue() {
    const selection = this.get('selection');
    if (selection) {
      this.set('value', get(selection, this.get('displayKey')));
      this.$().typeahead('val', get(selection, this.get('displayKey')));
    }
  },

  close() {
    this.$().typeahead('close');
  },

  focusIn() {
    let typeahead;
    if (!this.$().val()) {
      typeahead = this.$().data('ttTypeahead');
      typeahead.dropdown.update(this.$().val());
    }
  },

  willDestroyElement() {
    this.$().typeahead('destroy');
  }
});
