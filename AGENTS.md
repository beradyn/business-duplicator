# Architecture rules

- Preserve the imported BizQuest application's existing structure for scoped game updates; do not replace the app as part of a presentation or gameplay request.
- Keep event scheduling and affordability in a browser-safe pure module shared by the provider and decision UI so business rules can be tested independently.
- Mount mandatory business decisions beside the global reward overlay so changing screens cannot bypass the decision.
- Use the shared motion controls for game interactions and respect the system reduced-motion preference to keep feedback consistent and accessible.