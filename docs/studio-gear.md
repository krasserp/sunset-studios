# Reusable studio gear section

Edit the shared inventory in `data/studio_gear.yaml`. All pages using the section pick up these changes.

In a Hugo layout, add:

```go-html-template
{{ partial "studio-gear.html" (dict "id" "studio-gear") }}
```

In a Markdown content page whose layout renders `.Content`, add:

```text
{{< studio-gear >}}
```

If including the section twice on one page, give the second instance a unique ID:

```text
{{< studio-gear id="more-studio-gear" >}}
```

The winter retreat layout includes the section after its equipment overview. Categories use native `details` / `summary` elements and work with keyboard input and without JavaScript. Quantities are shown only where supplied in the inventory.

The inventory was transcribed from the supplied spreadsheet screenshot. The second sE Electronics model and AKAI MPK Mini suffix are clipped, so their entries use general names pending confirmation.
