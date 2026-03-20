# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - navigation "Main" [ref=e3]:
      - link "Passwordless Demo" [ref=e4] [cursor=pointer]:
        - /url: /
      - generic [ref=e5]:
        - link "User Settings" [ref=e6] [cursor=pointer]:
          - /url: /user-settings
        - link "Log Out" [ref=e7] [cursor=pointer]:
          - /url: /logout
  - main [ref=e8]:
    - generic [ref=e11]:
      - heading "Logout" [level=1] [ref=e13]
      - generic [ref=e14]:
        - paragraph [ref=e15]: You are currently logged in as Passkey E2E User
        - generic [ref=e16]:
          - button "Log Out" [ref=e17]
          - button "Cancel" [ref=e18]
  - contentinfo [ref=e19]:
    - generic [ref=e20]:
      - paragraph [ref=e21]:
        - text: Made with
        - img [ref=e22]
        - text: by
        - link "Ben Houston" [ref=e24] [cursor=pointer]:
          - /url: https://benhouston3d.com
      - link "See source code" [ref=e25] [cursor=pointer]:
        - /url: https://github.com/bhouston/passwordless-demo
        - img [ref=e26]
        - generic [ref=e28]: See source code
  - region "Notifications alt+T"
```