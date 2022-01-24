# Stimulus Controllers

> WIP - see RFC for more details
> Note: There is an `.eslintrc` file in this folder, this is so we can provide some stricter guard-rails for controller classes as code is set up.

-   Each file within this folder should contain one Stimulus controller, with the filename `MyAwesomeController.ts` (UpperCamelCase.ts).
-   If the controller has a static method `isIncludedInCore = true;` then it will be automatically included in the core JS bundle and registered.
-   Controllers that are included in the core will automatically be registered with the prefix `w` (e.g. `w-tabs`).
-   Controllers are classes and will allow for class inheritance to build on top of base behaviour for variations, however remember that static attributes do not get inherited.
-   All Controller classes must inherit the `AbstractController` and not directly use Stimulus' controller (this will raise a linting error), this is so that base behaviour and overrides can easily be set up.
-   See **LINKS_TO_DOCS** for more information no how to build controllers.
