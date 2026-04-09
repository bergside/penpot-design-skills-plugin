penpot.ui.open("TypeUI Design Skill Generator", `?theme=${penpot.theme}`);

// Update the theme in the iframe
penpot.on("themechange", (theme) => {
  penpot.ui.sendMessage({
    source: "penpot",
    type: "themechange",
    theme,
  });
});
