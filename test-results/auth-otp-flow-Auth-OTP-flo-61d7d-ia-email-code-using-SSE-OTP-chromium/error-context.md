# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e4]:
        - link "Passwordless Demo" [ref=e6] [cursor=pointer]:
          - /url: /
        - generic [ref=e7]:
          - link "Sign Up" [ref=e8] [cursor=pointer]:
            - /url: /signup
          - link "Login" [ref=e9] [cursor=pointer]:
            - /url: /login
  - group [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - heading "Create Account" [level=1] [ref=e15]
        - paragraph [ref=e16]: Enter your information to get started
      - generic [ref=e18]:
        - group [ref=e19]:
          - generic [ref=e20]: Name
          - textbox "Name" [ref=e21]:
            - /placeholder: John Doe
            - text: E2E User
        - group [ref=e22]:
          - generic [ref=e23]: Email
          - textbox "Email" [ref=e24]:
            - /placeholder: john@example.com
            - text: e2e-1773926245396@example.com
          - paragraph [ref=e25]: We'll send you a verification code to this email address
        - group [ref=e26]:
          - button "Sign Up" [ref=e27]
  - button "Open TanStack Devtools" [ref=e28] [cursor=pointer]:
    - img "TanStack Devtools" [ref=e29]
```