package consts

import "fmt"

// PluginType does overlap with logical.BackendType,
// but it's necessary here because directly using the
// logical package can often cause import cycles.
// Vendor plugins depend on logical.BackendType in
// its current location, so we can't move it here.
type PluginType int

const (
	PluginTypeUnknown PluginType = iota
	PluginTypeCredential
	PluginTypeSecrets
	PluginTypeDatabase
)

func (p PluginType) String() string {
	switch p {
	case PluginTypeSecrets:
		return "secret"
	case PluginTypeCredential:
		return "auth"
	case PluginTypeDatabase:
		return "database"
	default:
		return "unknown"
	}
}

func ParsePluginType(pluginType string) (PluginType, error) {
	switch pluginType {
	case "secret":
		return PluginTypeSecrets, nil
	case "auth":
		return PluginTypeCredential, nil
	case "database":
		return PluginTypeDatabase, nil
	default:
		return PluginTypeUnknown, fmt.Errorf("%s is not a supported plugin type", pluginType)
	}
}
