import {VectorIndexClientProps} from '../vector-index-client-props';
import {VectorIndexConfiguration} from '../config/vector-index-configuration';

export interface VectorIndexClientPropsWithConfig
  extends VectorIndexClientProps {
  configuration: VectorIndexConfiguration;
}
