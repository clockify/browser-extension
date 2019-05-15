'use strict';

// List items
// clockifyButton.render(
//   '.task-list-section-collection-list li:not(.clockify)',
//   { observe: true },
//   function(elem) {
//     var link,
//       container = $('.content-list-item-label', elem),
//       description = $('.content-list-item-name-wrapper', container).textContent;

//     // Have to remove the empty character projectName gets at the end
//     link = clockifyButton.createSmallButton(description);

//     container.appendChild(link);
//   }
// );

clockifyButton.render('#app-pane .task-pane-name-field-textarea:not(.clockify)', {observe: true}, (elem) => {
    var link,
      container = $('#app-pane .task-details-list'),
      descFunc = function() {
        return elem.value;
      },
      projectFunc = function() {
        return $('#app-pane .task-pane-details-list-link').textContent.trim();
      };

    // Have to remove the empty character projectName gets at the end
    link = clockifyButton.createSmallButton(descFunc);

    container.appendChild(link);
  }
);