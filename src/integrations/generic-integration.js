clockifyButton.render(
  '.clockify-container:not(.clockify)',
  {observe: true}, 
  (elem) => {
    const description = ("description" in elem.dataset) ? elem.dataset.description : "";
    const project = ("project" in elem.dataset) ? elem.dataset.project : null;
    const task = ("task" in elem.dataset) ? elem.dataset.task : null;
    const tags = ("tags" in elem.dataset) ? elem.dataset.tags.split(",") : [];
    const small = "small" in elem.dataset;

    const link = clockifyButton.createButton({
        description: description,
        projectName: project,
        taskName: task,
        tagNames: tags,
        small: small,
    });

    elem.appendChild(link);
  },
);
