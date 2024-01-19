# PullToInterfacor

---
![GitHub CI](https://github.com/d1820/PullToInterfacor/actions/workflows/node.js.yml/badge.svg)
![GitHub License](https://img.shields.io/github/license/d1820/PullToInterfacor?logo=github&logoColor=green)


A Visual Studio Code Extension to include the ability to **Pull** methods and properties to inherited interfaces and base classes. This is targeted to C# development and is meant as a supplemental extension to C# Dev Kit. This extension supports pulling public properties and methods to interfaces, and public and protected methods to base classes.

## Installation
---

<!-- Download and install the VSIX from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=DanTurco.CodeDocumentor) -->

## Table of Contents

<!-- toc -->

- [PullToInterfacor](#pulltointerfacor)
  - [Installation](#installation)
  - [Table of Contents](#table-of-contents)
  - [Instruction](#instruction)
  - [Caveats](#caveats)
  - [Known Issues](#known-issues)
  - [Supported Members](#supported-members)
    - [Interfaces](#interfaces)
    - [Base Classes](#base-classes)
  - [Usage Examples](#usage-examples)
  - [Special Thanks](#special-thanks)

<!-- tocstop -->

## Instruction
---

1. Once installed successful to Visual Studio Code. You can access the commands from F1 then search for **Pull To**.

## Caveats

- This extension only works for base classes and interfaces that have their own C# file. Having multiple interfaces defined in 1 file will not work.
- Interface files must following the convention **I**Name. The I is the only way it knows its an interface with doing a bunch of file parsing and inference. To keep it fast I went with convention.
- This is a lot of file parsing to determine what to move, that said the easiest was to ensure all the using are present were to copy them all from the main class to the base or interface, and deduplicate the list. With C# Dev Kit installed the cleanup from that is quick to remove unused using.
- When pulling full backed property in this version we do not move the private backed field, so if using full backed property you will need to move that yourself. I am open to accepting PRs to update that functionality 😁


## Known Issues


## Supported Members

### Interfaces

- public properties
- public methods

### Base Classes

- public/protected properties
- public/protected methods


## Usage Examples



<img src="./GifInstruction/warning wave line.gif" />





## Special Thanks
Some of the helpers were adopted from [devshop](https://github.com/devshop/csharp-model-to-builder)




