For ES6 and up, not need to set `stack`, e.g.:

```typescript
// NOT NEEDED
this.stack = new Error().stack;
```

or

```typescript
// NOT NEEDED
Error.captureStackTrace(this, AccessTokenNotFoundError);
```
