import json

data = {
  "type": "service_account",
  "project_id": "digital-assets-protection-mvp",
  "private_key_id": "288ed51eb95ef599559020ff0afd88ac62f41d36",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDCOnI23LBHLoQU\nSu5e/rtUm2fi1te+TfH0T4T8ihhLNwiB6xJSKEaaJQ9e0UuvP0QacDxDr5QdHWfn\n4OxJz9pa2ZzQBRAzGzD9/Utq+GaZdQrXdWl/nnJMayWOABEFcdfBz6KI1lM8yfEo\nTQPoC51hAVWNs/kdn6HGcgmIzJ5YblagWKXEB/+rCdXkIKR+Qq/+NMI1PHYv+K6w\n2gTkvxx2k+XhgpphvEM5zw8J3aTbxPtmdIj2jcynMLGnpQBSiO2HUfjLJKoXUpRk\npf6hD0N5MdO1NHebob1i1HvWBp41+GALV+KedgiBJCKfnQ3IbCZkZ1FmkJv3HlCq\n+vWg+d+vAgMBAAECggEAYPjOSm7fwgJK5ljM73fN7r2SXhJ276g524kSNAX8gB0P\nbdIAOS2rpk1HgccMOwhix7JunDqev/SNCpvlTSrt8XsBjGhiwKlcSgs7KsKvcwGZ\nMp6H2DQzC81ZGC8XUHkYyEaS9y/OqiSG92CQSTv3TNXeMZwADhbDrfEEqpzCmBJL\n1YacVjWWaWGfU5VtjypeGHHdtCCBNMr6C4x6G+U2iPZxHwnRA2hI3DC+kUf+wtZZ\no8AfvwGV/Ow82dshTwy4/ey4sW40/KUXeVq20c+SMvSHXzyvh1weWR5+wXI3FYpf\n9xhfpvA2e1XcQ6dX8iJvrhPKR0ivNHCVMz4He/HPOQKBgQDqS7zN8fPt55XQq5Yx\mnbE4QL55QhXk9Pf49ew588yMubx3AefgM1TS0Xwo26qjs8PFtR5BFcy9afy7G6z\naoGvidVE71lW8lRDurC7YLht2StrQ3ssvG8jEeKeVxOIV0f/Iw6iSgVGVN5aFHHo\nbIJqbWHGTu+QZ9hi+XMtUTidqQKBgQDUOISHcZxsHwvxLrFJBBIKnUJiLVDBkgWv\nk17lBgOjuSWXnzspF6KkFXBYsQOHV6KpdZ2iDSvwv9KYlt7aIBL6Qw8X8qH/+Wz9\nfzQFMUJ1CyGy6tQeS5CFwNazqotSTZqe0lJsPRxfBGFLjcHkGb1p44lfTTsCt75f\nG/fSb5B5lwKBgQCoLB7kcFRXopANjOwsxKOVo7EgL/5x5kEBhqhuaaV2ccUFO5sZ\nKTm4HOKh3J11vTXwrcFq7+urP1sC6iR3ke5uUnALoAWvfBdx2hI7HSykZGpe/rvu\nG39mW9MfNn9lsMiT4NUDNkBdAFPtspkkbKabv9Gbp1Mbgv515HmAwLjzqQKBgQCO\nRqnLKEbHUfUup7AhlIIH7bBQo7LNY3k+YZ2wC10rSXhDc3Q1M2xNdzYPr/T+qqkZ\n1QluWEhKKkAlHpifQfuXHpgi5P7o3q7MMJiOlpzIXUMlcTvuZ5ino0YNw9uNvQtZ\nSQYLHNlFdmlIPuxrYTpUoEA7zUovo0IU/2ohAbypVwKBgDrScrN3faJ+gvpo915W\nKjvOxkD5YaMsreMPIOqZue2WaX/4mKJpMbRGi3PecB9b6kaKQ3LZG2cCUHyRp24B\nhFI/pB05089egoH7EJTO/NzBjRCd0m5vF5vNoEYlG3Ud8rEXKsTMR+xsp8QcVsYj\n7H2cLIvrqsFI2ILopl/mP2EX\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@digital-assets-protection-mvp.iam.gserviceaccount.com",
  "client_id": "113482272717873188185",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40digital-assets-protection-mvp.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

with open("service-account.json", "w") as f:
    json.dump(data, f, indent=2)

print("service-account.json generated successfully!")
