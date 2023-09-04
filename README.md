# @aesop-fables/containr

`containr` is a lightweight Inversion of Control framework for Typescript. It is based on concepts/apis from `StructureMap` and Microsoft's Dependency Injection tooling.

## Installation
```
npm install @aesop-fables/containr
```
```
yarn add @aesop-fables/containr
```

## Docs
Our [docs](https://github.com/aesop-fables/containr) our hosted on [gitbook](https://github.com/aesop-fables/containr). 

## Usage
By and large, you really only do two kinds of things with `containr`:

1. Configure the container by registering the what and how `containr` should build or find requested services based on a key.
2. Resolve object instances of a service or dependency built out with all of its dependencies.

## Registration
There are a variety of registration functions on the `ServiceCollection` class that you can use to control:
1. How your value/class gets resolved
2. When it gets resolved

```
Note:
v0.3* of `containr` introduced a new/simplified registration model. The team comes from a .NET background and sadly we bring some of that with us into Typescript generics sometimes. We're learning :).
```

### 1. `factory(key: string, value: ValueFactoryDelegate, scope: Scopes)`
Use this approach when you want to register a function to create your value/class. If you need service resolution, the function you register will receive an instance of `IServiceContainer`.

```typescript
services.factory<string>(key, (container) => value, Scopes.Transient)
```

### 2. `singleton(key: string, value: T)`
Use this approach when you want to register a value directly.

```typescript
services.singleton<string>(key, 'Hello, World!');
```

### 3. `array(key: string, value: ValueFactoryDelegate<T> | T)`
Use this approach when you want to add to an array of dependencies. This is useful when a class is depending an array of policies, etc. 
This approach is typically paired with the `@injectArray(key: string)` decorator.

```typescript
services.array<string>(key, item1);
```

### 4. `arrayAutoResolve(key: string, type: Newable<T>)`
Use this approach when you want to add to an array of dependencies and also make use of `containr`'s auto resolution pipeline.
This approach is typically paired with the `@injectArray(key: string)` decorator.

```typescript
services.arrayAutoResolve<IPolicy>(key, MyPolicy);
```

### 5. `autoResolve(key: string, type: Newable<T>)`
Use this approach when you want to register a class and make use of `containr`'s auto resolution pipeline.

```typescript
services.autoResolve<ISomething>(key, Something);
```

## Scopes
Scopes control the lifetime and any caching of your dependencies. `containr` supports three scopes:

### 1. Transient
This is the default scope. Using this scope means that the container will cache your value. 
Most importantly, this scope is maintained when creating child containers if the value has already been resolved.

### 2. Singleton
This is the most straight-forward scope. Using this scope means that the container will cache your resolved value.
This scope is always maintained when creating child containers.

### 3. Unique
Using this scope means that every attempt to resolve the dependency will result in a fresh instance (of the top-most dependency being requested).

## Core Concepts

### Configuring dependencies
In `containr`, values are registered against unique keys (strings). When you request for the container to `get` a dependency, you use a key to refer to it. The resolution logic works like:

1. Delegate to the configured scope for managing lifecyle (i.e., transient, unique, singleton)
2. When the dependency is being resolved and a factory was specified, invoke the factory (the scope may cache the value)
3. Pass it along to `containr`'s interceptor model. 

### The "Bootstrapping" Phase
The process of creating a container is known as the `bootstrapping` phase (or used as a verb to refer to the act of creating the container). 

### Auto Resolution
Due to limitations in Typescript's support for overloading, there are functions
designed for registering dependencies to use auto-resolution (e.g., add, use).

### Service Modules
Service modules are blocks of code that are used to modify a `ServiceCollection`. They're designed to be reused and shared across projects (exported from custom npm packages). While it can be argued that it overlaps with React's naming conventions for hooks, we've employed a `use*` naming convention for service modules (e.g., `useMyApi`).

## Example
```typescript
// CaseApi.ts
import { AxiosInstance } from 'axios';
import { AxiosKeys } from '@aesop-fables/containr-axios';
import { IErrorRelay, ErrorRelayKeys } from '@aesop-fables/containr-error-relay';
import { inject } from '@aesop-fables/containr';

export interface ViewCaseModel {
    id: string;
    title: string;
    // ....
}

export interface ICaseApi {
    getCaseById(id: string): Promise<ViewCaseModel | null>;
}

export class CaseApi implements ICaseApi {
    constructor(
        @inject(AxiosKeys.Axios) private readonly axios: AxiosInstance,
        @inject(ErrorRelayKeys.Relay) private readonly errorRelay: IErrorRelay,
    ) {}

    getCaseById(id: string): Promise<ViewCaseModel | null> {
        return this.errorRelay.execute<ViewCaseModel>('CaseApi', async () => {
            const { data } = await this.axios.get<ViewCaseModel>(`/cases/${id}`);
            return data;
        });
    }
}

// bootstrap.ts
import { createContainer, createServiceModule, Scopes } from '@aesop-fables/containr';
import { useAxios } from '@aesop-fables/containr-axios';
import { ICaseApi, CaseApi } from './CaseApi';
import CaseServiceKeys from './CaseServiceKeys';

const useCaseServices = createServiceModule('cases', (services) => {
    services.factory<ICaseApi>(CaseServiceKeys.Api, CaseApi, Scopes.Transient);
});

export default function() {
    return createContainer([
        useAxios,
        useCaseServices,
    ]);
}

// App.tsx
import React from 'react';
import bootstrap from './Bootstrap';
import { ServiceContainer } from '@aesop-fables/containr-react';

const container = bootstrap();
export const App: React.FC = () => {
    return (
        <ServiceContainer container={container}>
         // ...
        </ServiceContainer>
    );
};

// ViewCase.tsx
import React from 'react';
import { ICaseApi } from './CaseApi';
import { useService } from '@aesop-fables/containr-react';
import CaseServiceKeys from './CaseServiceKeys';

export ViewCase: React.FC = ({ route }) => {
    const { id } = route;
    const [isLoading, setIsLoading] = useState(true);
    const [caseModel, setCaseModel] = useState<ViewCaseModel | undefined>(undefined);
    const caseApi = useService<ICaseApi>(CaseServiceKeys.Api);
    // We're using our error-relay framework that connects to react
    // so errors are handled at a higher level
    
    useEffect(() => {
        (async () => {
            try {
                const model = await caseApi.getCaseById(id);
                if (model) {
                    setCaseModel(model);
                }
            } finally {
                setIsLoading(false);
            }
        })();
    }
    }, [id]);

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (!caseModel) {
        return <div />;
    }

    return <p>{caseModel.title}</p>;
};
```
