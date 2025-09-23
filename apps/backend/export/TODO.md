# TODO backend-export

- [ ] Notebook export streaming API [tags: component=backend-export; feature=feat-lesson-generation; priority=P1; owner=[TBD]; due=2025-10-16]
  Implement `/export` endpoint returning streamed `.ipynb` with content-length fallback; include filename suggestions and error payloads per PRD §7.1 export flow.
- [ ] Artifact persistence contract [tags: component=backend-export; feature=feat-lesson-generation; priority=P2; owner=[TBD]; due=2025-10-23]
  Define manifest + directory layout for exports (timestamps, provider/model metadata) consistent across web and CLI.

