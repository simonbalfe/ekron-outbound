1. Never write comments in code (IMPORTANT)
2. Keep code simple and clear, do not use hacks that work but are not readable by humans.
3. Do not install any packages yourself or run any commands, ask the user at the end of the request once you are done to install, list bullet points of what to install
4. Do not do anything other than writing and reading code files.
5. Keep SOLID priniciples
6. Keep DRY principles
7. Keep KISS principles
8. Always enforce typescript type safety, do not use `any` or workarounds to fix things.
9. Do not dump everything in one mega file, actually think about the architecture and clean code as you go along.
   - If a file becomes too big and obnoxious, try to seperate concerns or pull out things to seperate files.
10. If a type, function, or class is used in multiple places make it clear in a shared folder between these two places like `commmon`.
11. Dont add nestjs modules unless prompted to.