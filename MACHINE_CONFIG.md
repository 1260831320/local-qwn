# Machine Config

This branch supports tracked machine-specific runtime configuration.

Selection order:

1. `QWEN_MACHINE_PROFILE`
2. `qwen.machine.profile`
3. `COMPUTERNAME`
4. `HOSTNAME`
5. `default`

Resolution rules:

- Profile names are normalized to lowercase.
- Only `a-z`, `0-9`, `.`, `_`, and `-` are allowed.
- Shared defaults are loaded from `src/main/resources/machines/common.yml`.
- Generic fallback values are loaded from `src/main/resources/machines/default.yml`.
- If `src/main/resources/machines/<profile>.yml` exists, it overrides the shared defaults.
- If the requested profile does not exist, the application keeps using `default`.

Current tracked profiles:

- `default`
- `redmibook14`

Examples:

```powershell
$env:QWEN_MACHINE_PROFILE='redmibook14'
.\mvnw.cmd spring-boot:run
```

```powershell
Remove-Item Env:QWEN_MACHINE_PROFILE -ErrorAction SilentlyContinue
.\mvnw.cmd spring-boot:run
```

To add another machine:

1. Create `src/main/resources/machines/<profile>.yml`
2. Commit it to the repo
3. Set `QWEN_MACHINE_PROFILE=<profile>` on that machine if you do not want to rely on the hostname
