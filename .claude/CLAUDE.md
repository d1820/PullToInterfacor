# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run compile          # TypeScript compile
npm run watch            # compile in watch mode
npm run lint             # ESLint on src/
npm run lint-fix         # ESLint with auto-fix
npm run test-jest        # run unit tests (no VS Code host needed)
npm run test-jest-coverage
npm test                 # integration tests (requires real VS Code)
npm run vscode:package   # build .vsix
```

Run a single test file:
```bash
npx jest src/utils/csharp-util.test.ts --verbose
```

Run a single test by name:
```bash
npx jest --testNamePattern="should return the namespace" --verbose
```

CI runs `npm run pretest` (compile + lint) then `npm run test-jest-coverage`.

## Architecture

VS Code extension (TypeScript) that pulls C# class members up to an interface or base class. Activates only on `onLanguage:csharp`.

### Entry point

`src/extension.ts` registers one command: `pulltointerfacor.pullto`. On invoke it calls `csharp.getSubCommandsAsync()` to discover all inherited types, shows a `showQuickPick` dropdown, then dynamically registers per-target sub-commands (`pulltointerfacor.pullto.<TargetName>`).

### Core modules

`src/pull-to-interface-csharp.ts` -- all high-level orchestration:
- `getSubCommandsAsync`: parses the active file, extracts inherited type names, recursively opens each `.cs` file to walk the full inheritance chain
- `getSignatureToPull`: walks up from cursor to find the member declaration, formats it for interface/base-class insertion
- `addMemberToDocument`: finds the target type declaration via regex, inserts the member inside its opening brace
- `addUsingsToDocument`: merges `using` statements from source into target, deduplicating
- `applyEditsAsync`: applies transformed file content via `WorkspaceEdit.replace()` over the full file range

Behavior differs by target type:
- **Interface** (name starts with `I`): inserts signature only, nothing removed from source
- **Base class**: copies full member body to base, removes member from source file
- **Protected members**: interfaces are filtered from the target list (interfaces cannot have protected members)

`src/utils/csharp-util.ts` -- all C# text parsing:
- `SignatureLineResult` -- central DTO carrying `signature`, `signatureType` (enum: `FullProperty | LambaProperty | Method | Unknown`), `lineMatchStartsOn`, `accessor`, and `preSignatureContent` (attributes/XML doc lines above the member)
- `getMemberBodyByBrackets` / `getMemberBodyBySemiColon` -- extract full member bodies for base-class pulls

`src/interfaces/window.interface.ts` -- `IWindow` abstraction over `vscode.window` (`activeTextEditor`, `showErrorMessage`, `showInformationMessage`). Passed into all functions so unit tests work without a real VS Code host.

### Testing

Jest with `ts-jest`. VS Code API mocked globally via `__mocks__/vscode.js` (delegates to `jest-mock-vscode`). Tests use `MockTextEditor` and `createTextDocument` to simulate editor state with cursor positions. Test files live alongside source (`*.test.ts`) except integration tests in `src/test/`.

`Sample/SampleProject/` is a .NET 8 C# console project used only for manual extension testing -- ignore it in code changes.

`src/pull-to-interface-typescript.ts` is an unused stub -- not wired into the extension command.
