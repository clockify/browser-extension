clockifyButton.render('div[role=menu]:not(.clockify)', {observe: true}, function (elem) {
  link = clockifyButton.createButton({
      description: "TODO",
      projectName: "TODO",
      taskName: "TODO",
      tagNames: ["TODO"]
  });
  inputForm = clockifyButton.createInput({
      description: "TODO",
      projectName: "TODO",
      taskName: "TODO",
      tagNames: ["TODO"]
  });

  elem.prepend(link);
  elem.prepend(inputForm);
});
