For ES6 and up, not need to set `stack`, e.g.:

```typescript
this.stack = new Error().stack;
```

or

```typescript
Error.captureStackTrace(this, AccessTokenNotFoundError);
```
